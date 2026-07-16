package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// LevelAlert is above Error for events that need operator attention
// (deals, circuit breaker). Records at this level are sent to Telegram.
const LevelAlert = slog.Level(12)

// levelReplaceAttr returns the custom level name for log output.
func levelReplaceAttr(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.LevelKey {
		if lvl, ok := a.Value.Any().(slog.Level); ok && lvl >= LevelAlert {
			return slog.String(slog.LevelKey, "ALERT")
		}
	}
	return a
}

// TelegramConfig holds Bot API parameters.
type TelegramConfig struct {
	Token  string
	ChatID string
}

// telegramHandler is a slog.Handler that sends records at level >= LevelAlert
// to Telegram. Delivery is async via a buffered channel so logging is not
// blocked; when the buffer is full, messages are dropped.
type telegramHandler struct {
	queue chan string
	attrs []slog.Attr
}

func newTelegramHandler(cfg TelegramConfig) *telegramHandler {
	h := &telegramHandler{
		queue: make(chan string, 64),
	}
	go h.worker(cfg)
	return h
}

func (h *telegramHandler) Enabled(_ context.Context, level slog.Level) bool {
	return level >= LevelAlert
}

func (h *telegramHandler) Handle(_ context.Context, r slog.Record) error {
	var b strings.Builder
	b.WriteString("[ALERT] ")
	b.WriteString(r.Message)

	appendAttr := func(a slog.Attr) bool {
		b.WriteString(fmt.Sprintf("\n%s: %v", a.Key, a.Value.Any()))
		return true
	}
	for _, a := range h.attrs {
		appendAttr(a)
	}
	r.Attrs(appendAttr)

	select {
	case h.queue <- b.String():
	default: // queue full — do not block the application
	}
	return nil
}

func (h *telegramHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &telegramHandler{
		queue: h.queue,
		attrs: append(append([]slog.Attr{}, h.attrs...), attrs...),
	}
}

func (h *telegramHandler) WithGroup(string) slog.Handler {
	return h
}

func (h *telegramHandler) worker(cfg TelegramConfig) {
	client := &http.Client{Timeout: 10 * time.Second}
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", cfg.Token)

	for text := range h.queue {
		body, err := json.Marshal(map[string]string{
			"chat_id": cfg.ChatID,
			"text":    text,
		})
		if err != nil {
			continue
		}

		resp, err := client.Post(url, "application/json", bytes.NewReader(body))
		if err != nil {
			continue
		}
		_ = resp.Body.Close()

		// Bot API limits ~30 messages/sec — small pause between sends.
		time.Sleep(100 * time.Millisecond)
	}
}
