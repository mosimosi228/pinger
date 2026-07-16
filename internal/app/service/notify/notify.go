package notify

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

type telegramConfig struct {
	Token  string `json:"token"`
	ChatID string `json:"chat_id"`
}

type webhookConfig struct {
	URL string `json:"url"`
}

type checkSnapshot struct {
	Status     string `json:"status"`
	StatusCode *int64 `json:"status_code,omitempty"`
	LatencyMS  *int64 `json:"latency_ms,omitempty"`
	Error      string `json:"error,omitempty"`
	CheckedAt  string `json:"checked_at,omitempty"`
}

type alertPayload struct {
	Event           string         `json:"event"` // "down" | "up"
	Message         string         `json:"message"`
	MessageHTML     string         `json:"message_html,omitempty"`
	MessageMarkdown string         `json:"message_markdown,omitempty"`
	MonitorID       int64          `json:"monitor_id"`
	MonitorName     string         `json:"monitor_name"`
	MonitorType     string         `json:"monitor_type"`
	Target          string         `json:"target"`
	IntervalSec     int64          `json:"interval_sec"`
	TimeoutSec      int64          `json:"timeout_sec"`
	Previous        *checkSnapshot `json:"previous,omitempty"`
	Current         checkSnapshot  `json:"current"`
	Downtime        string         `json:"downtime,omitempty"`
	DowntimeSeconds *int64         `json:"downtime_seconds,omitempty"`
	LastUpAt        string         `json:"last_up_at,omitempty"`
	OccurredAt      string         `json:"occurred_at"`
}

// OnStatusChange sends alerts to linked notifications when status changes.
func OnStatusChange(ctx context.Context, monitor *mapping.Monitor, prev, curr *mapping.Check) error {
	notifications, err := cache.NotificationsByMonitor().GetOrLoad(monitor.ID, func() ([]*mapping.Notification, error) {
		dbCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		return repo.GetRepository().ListEnabledNotificationsByMonitor(dbCtx, monitor.ID)
	})
	if err != nil {
		return err
	}

	payload := buildAlert(ctx, monitor, prev, curr)
	for _, n := range notifications {
		if n == nil || n.Enabled != 1 {
			continue
		}
		switch n.Type {
		case "telegram":
			if err := sendTelegram(ctx, n.Config, payload); err != nil {
				slog.Warn("telegram notify", slog.Int64("notification_id", n.ID), slog.Any("err", err))
			}
		case "webhook":
			if err := sendWebhook(ctx, n.Config, payload); err != nil {
				slog.Warn("webhook notify", slog.Int64("notification_id", n.ID), slog.Any("err", err))
			}
		default:
			slog.Debug("unknown notification type", slog.String("type", n.Type))
		}
	}
	return nil
}

func buildAlert(ctx context.Context, monitor *mapping.Monitor, prev, curr *mapping.Check) alertPayload {
	event := "down"
	if curr.Status == 1 {
		event = "up"
	}

	payload := alertPayload{
		Event:       event,
		MonitorID:   monitor.ID,
		MonitorName: monitor.Name,
		MonitorType: monitor.Type,
		Target:      monitor.Target,
		IntervalSec: monitor.Interval,
		TimeoutSec:  monitor.Timeout,
		Previous:    snapshotCheck(prev),
		Current:     *snapshotCheck(curr),
		OccurredAt:  curr.CheckedAt,
	}

	if event == "up" && prev != nil && prev.Status == 0 {
		if secs, since, ok := resolveDowntime(ctx, monitor.ID, curr); ok {
			payload.DowntimeSeconds = &secs
			payload.Downtime = formatDuration(secs)
			payload.LastUpAt = since
		} else if secs, ok := durationSeconds(prev.CheckedAt, curr.CheckedAt); ok {
			payload.DowntimeSeconds = &secs
			payload.Downtime = formatDuration(secs)
			payload.LastUpAt = prev.CheckedAt
		}
	}

	payload.Message = formatMessage(payload)
	payload.MessageHTML = formatMessageHTML(payload)
	payload.MessageMarkdown = formatMessageRichMarkdown(payload)
	return payload
}

func resolveDowntime(ctx context.Context, monitorID int64, curr *mapping.Check) (int64, string, bool) {
	dbCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	lastUp, err := repo.GetRepository().GetCheckBeforeIDByStatus(dbCtx, mapping.GetCheckBeforeIDByStatusParams{
		MonitorID: monitorID,
		Status:    1,
		ID:        curr.ID,
	})
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			slog.Debug("resolve downtime", slog.Int64("monitor_id", monitorID), slog.Any("err", err))
		}
		return 0, "", false
	}
	secs, ok := durationSeconds(lastUp.CheckedAt, curr.CheckedAt)
	if !ok {
		return 0, "", false
	}
	return secs, lastUp.CheckedAt, true
}

func snapshotCheck(c *mapping.Check) *checkSnapshot {
	if c == nil {
		return nil
	}
	s := &checkSnapshot{
		Status:    statusLabel(c.Status),
		CheckedAt: c.CheckedAt,
	}
	if c.StatusCode.Valid {
		v := c.StatusCode.Int64
		s.StatusCode = &v
	}
	if c.Latency.Valid {
		v := c.Latency.Int64
		s.LatencyMS = &v
	}
	if c.Error.Valid {
		s.Error = c.Error.String
	}
	return s
}

func statusLabel(status int64) string {
	if status == 1 {
		return "UP"
	}
	return "DOWN"
}

func formatMessage(p alertPayload) string {
	var b strings.Builder
	if p.Event == "down" {
		b.WriteString("🔴 Pinger · DOWN\n")
	} else {
		b.WriteString("🟢 Pinger · UP\n")
	}

	fmt.Fprintf(&b, "Monitor: %s\n", p.MonitorName)
	fmt.Fprintf(&b, "Type: %s\n", p.MonitorType)
	fmt.Fprintf(&b, "Target: %s\n", p.Target)
	fmt.Fprintf(&b, "Interval: %ds · Timeout: %ds\n", p.IntervalSec, p.TimeoutSec)

	if p.Previous != nil {
		fmt.Fprintf(&b, "\nPrevious: %s", p.Previous.Status)
		writeCheckDetails(&b, p.Previous)
	} else {
		b.WriteString("\nPrevious: unknown")
	}

	fmt.Fprintf(&b, "\nCurrent: %s", p.Current.Status)
	writeCheckDetails(&b, &p.Current)

	if p.Downtime != "" {
		fmt.Fprintf(&b, "\n\nDowntime: %s", p.Downtime)
		if p.LastUpAt != "" {
			fmt.Fprintf(&b, "\nLast UP at: %s", p.LastUpAt)
		}
	}

	fmt.Fprintf(&b, "\n\nAt: %s", p.OccurredAt)
	return b.String()
}

// formatMessageHTML — Telegram HTML parse_mode (Bot API formatting options).
func formatMessageHTML(p alertPayload) string {
	var b strings.Builder
	if p.Event == "down" {
		b.WriteString("🔴 <b>Pinger · DOWN</b>\n")
	} else {
		b.WriteString("🟢 <b>Pinger · UP</b>\n")
	}

	fmt.Fprintf(&b, "<b>Monitor:</b> %s\n", html.EscapeString(p.MonitorName))
	fmt.Fprintf(&b, "<b>Type:</b> <code>%s</code>\n", html.EscapeString(p.MonitorType))
	fmt.Fprintf(&b, "<b>Target:</b> <code>%s</code>\n", html.EscapeString(p.Target))
	fmt.Fprintf(&b, "<b>Interval:</b> %ds · <b>Timeout:</b> %ds\n", p.IntervalSec, p.TimeoutSec)

	if p.Previous != nil {
		fmt.Fprintf(&b, "\n<b>Previous:</b> %s", statusHTML(p.Previous.Status))
		writeCheckDetailsHTML(&b, p.Previous)
	} else {
		b.WriteString("\n<b>Previous:</b> <i>unknown</i>")
	}

	fmt.Fprintf(&b, "\n<b>Current:</b> %s", statusHTML(p.Current.Status))
	writeCheckDetailsHTML(&b, &p.Current)

	if p.Downtime != "" {
		fmt.Fprintf(&b, "\n\n⏱ <b>Downtime:</b> <code>%s</code>", html.EscapeString(p.Downtime))
		if p.LastUpAt != "" {
			fmt.Fprintf(&b, "\n<b>Last UP at:</b> <code>%s</code>", html.EscapeString(p.LastUpAt))
		}
	}

	fmt.Fprintf(&b, "\n\n<i>At:</i> <code>%s</code>", html.EscapeString(p.OccurredAt))
	return b.String()
}

func statusHTML(status string) string {
	switch status {
	case "UP":
		return "<b>UP</b>"
	case "DOWN":
		return "<b>DOWN</b>"
	default:
		return html.EscapeString(status)
	}
}

func writeCheckDetails(b *strings.Builder, s *checkSnapshot) {
	if s == nil {
		return
	}
	parts := make([]string, 0, 4)
	if s.StatusCode != nil {
		parts = append(parts, fmt.Sprintf("HTTP %d", *s.StatusCode))
	}
	if s.LatencyMS != nil {
		parts = append(parts, fmt.Sprintf("%dms", *s.LatencyMS))
	}
	if s.CheckedAt != "" {
		parts = append(parts, s.CheckedAt)
	}
	if len(parts) > 0 {
		fmt.Fprintf(b, " (%s)", strings.Join(parts, " · "))
	}
	if s.Error != "" {
		fmt.Fprintf(b, "\n  Error: %s", s.Error)
	}
}

func writeCheckDetailsHTML(b *strings.Builder, s *checkSnapshot) {
	if s == nil {
		return
	}
	parts := make([]string, 0, 4)
	if s.StatusCode != nil {
		parts = append(parts, fmt.Sprintf("HTTP %d", *s.StatusCode))
	}
	if s.LatencyMS != nil {
		parts = append(parts, fmt.Sprintf("%dms", *s.LatencyMS))
	}
	if s.CheckedAt != "" {
		parts = append(parts, html.EscapeString(s.CheckedAt))
	}
	if len(parts) > 0 {
		fmt.Fprintf(b, " (%s)", strings.Join(parts, " · "))
	}
	if s.Error != "" {
		fmt.Fprintf(b, "\n<blockquote expandable>%s</blockquote>", html.EscapeString(s.Error))
	}
}

// formatMessageRichMarkdown is a markdown table for sendRichMessage.
func formatMessageRichMarkdown(p alertPayload) string {
	title := "🟢 Pinger · UP"
	if p.Event == "down" {
		title = "🔴 Pinger · DOWN"
	}

	rows := [][2]string{
		{"Monitor", p.MonitorName},
		{"Type", p.MonitorType},
		{"Target", p.Target},
		{"Interval", fmt.Sprintf("%ds", p.IntervalSec)},
		{"Timeout", fmt.Sprintf("%ds", p.TimeoutSec)},
	}
	if p.Previous != nil {
		rows = append(rows, [2]string{"Previous", formatCheckPlain(p.Previous)})
	} else {
		rows = append(rows, [2]string{"Previous", "unknown"})
	}
	rows = append(rows, [2]string{"Current", formatCheckPlain(&p.Current)})
	if p.Downtime != "" {
		rows = append(rows, [2]string{"Downtime", p.Downtime})
	}
	if p.LastUpAt != "" {
		rows = append(rows, [2]string{"Last UP at", p.LastUpAt})
	}
	rows = append(rows, [2]string{"At", p.OccurredAt})

	var b strings.Builder
	fmt.Fprintf(&b, "## %s\n\n", escapeRichMD(title))
	b.WriteString("| Field | Value |\n")
	b.WriteString("|:------|:------|\n")
	for _, row := range rows {
		fmt.Fprintf(&b, "| %s | %s |\n", escapeRichTableCell(row[0]), escapeRichTableCell(row[1]))
	}
	if p.Current.Error != "" {
		fmt.Fprintf(&b, "\n> **Error**\n>\n> `%s`\n", escapeRichMD(p.Current.Error))
	}
	return b.String()
}

func formatCheckPlain(s *checkSnapshot) string {
	if s == nil {
		return "—"
	}
	parts := []string{s.Status}
	if s.StatusCode != nil {
		parts = append(parts, fmt.Sprintf("HTTP %d", *s.StatusCode))
	}
	if s.LatencyMS != nil {
		parts = append(parts, fmt.Sprintf("%dms", *s.LatencyMS))
	}
	if s.CheckedAt != "" {
		parts = append(parts, s.CheckedAt)
	}
	return strings.Join(parts, " · ")
}

func escapeRichTableCell(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "|", "\\|")
	return escapeRichMD(s)
}

func escapeRichMD(s string) string {
	replacer := strings.NewReplacer(
		"\\", "\\\\",
		"`", "\\`",
		"*", "\\*",
		"_", "\\_",
		"[", "\\[",
		"]", "\\]",
	)
	return replacer.Replace(s)
}

func richTableBlocks(p alertPayload) []map[string]any {
	title := "🟢 Pinger · UP"
	if p.Event == "down" {
		title = "🔴 Pinger · DOWN"
	}

	type kv struct{ k, v string }
	rows := []kv{
		{"Monitor", p.MonitorName},
		{"Type", p.MonitorType},
		{"Target", p.Target},
		{"Interval", fmt.Sprintf("%ds", p.IntervalSec)},
		{"Timeout", fmt.Sprintf("%ds", p.TimeoutSec)},
	}
	if p.Previous != nil {
		rows = append(rows, kv{"Previous", formatCheckPlain(p.Previous)})
	} else {
		rows = append(rows, kv{"Previous", "unknown"})
	}
	rows = append(rows, kv{"Current", formatCheckPlain(&p.Current)})
	if p.Downtime != "" {
		rows = append(rows, kv{"Downtime", p.Downtime})
	}
	if p.LastUpAt != "" {
		rows = append(rows, kv{"Last UP at", p.LastUpAt})
	}
	rows = append(rows, kv{"At", p.OccurredAt})

	cells := make([][]map[string]any, 0, len(rows)+1)
	cells = append(cells, []map[string]any{
		{"text": "Field", "is_header": true, "align": "left", "valign": "middle"},
		{"text": "Value", "is_header": true, "align": "left", "valign": "middle"},
	})
	for _, row := range rows {
		cells = append(cells, []map[string]any{
			{"text": row.k, "align": "left", "valign": "middle"},
			{"text": row.v, "align": "left", "valign": "middle"},
		})
	}

	blocks := []map[string]any{
		{
			"type": "heading",
			"size": 2,
			"text": title,
		},
		{
			"type":        "table",
			"is_bordered": true,
			"is_striped":  true,
			"cells":       cells,
		},
	}
	if p.Current.Error != "" {
		blocks = append(blocks,
			map[string]any{
				"type": "heading",
				"size": 4,
				"text": "Error",
			},
			map[string]any{
				"type": "pre",
				"text": p.Current.Error,
			},
		)
	}
	return blocks
}

func parseCheckTime(value string) (time.Time, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, false
	}
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.ParseInLocation(layout, value, time.UTC); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func durationSeconds(from, to string) (int64, bool) {
	a, okA := parseCheckTime(from)
	b, okB := parseCheckTime(to)
	if !okA || !okB || b.Before(a) {
		return 0, false
	}
	return int64(b.Sub(a).Seconds()), true
}

func formatDuration(secs int64) string {
	if secs < 0 {
		secs = 0
	}
	d := time.Duration(secs) * time.Second
	h := int64(d.Hours())
	m := int64(d.Minutes()) % 60
	s := int64(d.Seconds()) % 60
	switch {
	case h > 0:
		return fmt.Sprintf("%dh %dm %ds", h, m, s)
	case m > 0:
		return fmt.Sprintf("%dm %ds", m, s)
	default:
		return fmt.Sprintf("%ds", s)
	}
}

func sendTelegram(ctx context.Context, raw string, payload alertPayload) error {
	var cfg telegramConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return fmt.Errorf("parse telegram config: %w", err)
	}
	if cfg.Token == "" || cfg.ChatID == "" {
		return fmt.Errorf("telegram config requires token and chat_id")
	}

	if err := sendTelegramRich(ctx, cfg, payload); err == nil {
		return nil
	} else {
		slog.Debug("telegram rich message failed, fallback to HTML", slog.Any("err", err))
	}

	text := payload.MessageHTML
	if text == "" {
		text = payload.Message
	}
	return telegramPOST(ctx, cfg.Token, "sendMessage", map[string]any{
		"chat_id":                  cfg.ChatID,
		"text":                     text,
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	})
}

func sendTelegramRich(ctx context.Context, cfg telegramConfig, payload alertPayload) error {
	if err := telegramPOST(ctx, cfg.Token, "sendRichMessage", map[string]any{
		"chat_id": cfg.ChatID,
		"rich_message": map[string]any{
			"blocks": richTableBlocks(payload),
		},
	}); err == nil {
		return nil
	}

	return telegramPOST(ctx, cfg.Token, "sendRichMessage", map[string]any{
		"chat_id": cfg.ChatID,
		"rich_message": map[string]any{
			"markdown": payload.MessageMarkdown,
		},
	})
}

func telegramPOST(ctx context.Context, token, method string, payload map[string]any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	url := fmt.Sprintf("https://api.telegram.org/bot%s/%s", token, method)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode >= 300 {
		return fmt.Errorf("telegram %s status %d: %s", method, resp.StatusCode, strings.TrimSpace(string(respBody)))
	}
	var parsed struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal(respBody, &parsed); err == nil && !parsed.OK {
		return fmt.Errorf("telegram %s: %s", method, parsed.Description)
	}
	return nil
}

func sendWebhook(ctx context.Context, raw string, payload alertPayload) error {
	var cfg webhookConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return fmt.Errorf("parse webhook config: %w", err)
	}
	if cfg.URL == "" {
		return fmt.Errorf("webhook config requires url")
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.URL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("webhook status %d", resp.StatusCode)
	}
	return nil
}
