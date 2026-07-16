package answer

import (
	"database/sql"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

type MonitorResponse struct {
	ID            int64    `json:"id"`
	UserID        string   `json:"user_id"`
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	Target        string   `json:"target"`
	Interval      int64    `json:"interval"`
	Timeout       int64    `json:"timeout"`
	Confirmations int64    `json:"confirmations"`
	Enabled       bool     `json:"enabled"`
	CreatedAt     string   `json:"created_at"`
	NextCheckAt   string   `json:"next_check_at"`
	LastStatus    *bool    `json:"last_status,omitempty"`
	LastLatency   *int64   `json:"last_latency,omitempty"`
	LastChecked   string   `json:"last_checked_at,omitempty"`
	Uptime1h      *float64 `json:"uptime_1h,omitempty"`
}

type CheckResponse struct {
	ID         int64  `json:"id"`
	MonitorID  int64  `json:"monitor_id"`
	Status     bool   `json:"status"`
	StatusCode *int64 `json:"status_code,omitempty"`
	Latency    *int64 `json:"latency,omitempty"`
	Error      string `json:"error,omitempty"`
	CheckedAt  string `json:"checked_at"`
}

type NotificationResponse struct {
	ID      int64  `json:"id"`
	UserID  string `json:"user_id"`
	Type    string `json:"type"`
	Config  string `json:"config"`
	Enabled bool   `json:"enabled"`
}

type StatusPageResponse struct {
	ID       int64             `json:"id"`
	UserID   string            `json:"user_id"`
	Name     string            `json:"name"`
	Slug     string            `json:"slug"`
	Public   bool              `json:"public"`
	Monitors []MonitorResponse `json:"monitors,omitempty"`
}

type PublicStatusPageResponse struct {
	Name     string            `json:"name"`
	Slug     string            `json:"slug"`
	Monitors []MonitorResponse `json:"monitors"`
}

func MonitorFromModel(m *mapping.Monitor) MonitorResponse {
	return MonitorResponse{
		ID:            m.ID,
		UserID:        m.UserID,
		Name:          m.Name,
		Type:          m.Type,
		Target:        m.Target,
		Interval:      m.Interval,
		Timeout:       m.Timeout,
		Confirmations: m.Confirmations,
		Enabled:       m.Enabled == 1,
		CreatedAt:     m.CreatedAt,
		NextCheckAt:   m.NextCheckAt,
	}
}

func CheckFromModel(c *mapping.Check) CheckResponse {
	out := CheckResponse{
		ID:        c.ID,
		MonitorID: c.MonitorID,
		Status:    c.Status == 1,
		CheckedAt: c.CheckedAt,
	}
	if c.StatusCode.Valid {
		v := c.StatusCode.Int64
		out.StatusCode = &v
	}
	if c.Latency.Valid {
		v := c.Latency.Int64
		out.Latency = &v
	}
	if c.Error.Valid {
		out.Error = c.Error.String
	}
	return out
}

func NotificationFromModel(n *mapping.Notification) NotificationResponse {
	return NotificationResponse{
		ID:      n.ID,
		UserID:  n.UserID,
		Type:    n.Type,
		Config:  n.Config,
		Enabled: n.Enabled == 1,
	}
}

func StatusPageFromModel(sp *mapping.StatusPage) StatusPageResponse {
	return StatusPageResponse{
		ID:     sp.ID,
		UserID: sp.UserID,
		Name:   sp.Name,
		Slug:   sp.Slug,
		Public: sp.Public == 1,
	}
}

func NullInt(v sql.NullInt64) *int64 {
	if !v.Valid {
		return nil
	}
	x := v.Int64
	return &x
}
