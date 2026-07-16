package live

import (
	"context"
	"log/slog"
	"time"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

// PublishCheck sends check results to user subscribers and public status pages.
func PublishCheck(ctx context.Context, monitor *mapping.Monitor, check *mapping.Check) {
	if monitor == nil || check == nil {
		return
	}

	evt := StatusEvent{
		ID:        monitor.ID,
		UserID:    monitor.UserID,
		Status:    check.Status == 1,
		CheckedAt: check.CheckedAt,
		Enabled:   monitor.Enabled == 1,
	}
	if check.Latency.Valid {
		v := check.Latency.Int64
		evt.Latency = &v
	}
	if uptime := uptime1h(ctx, monitor.ID); uptime != nil {
		evt.Uptime1h = uptime
	}

	slugs := make([]string, 0)
	pages, err := repo.GetRepository().ListStatusPagesByMonitor(ctx, monitor.ID)
	if err != nil {
		slog.Warn("live list status pages", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
	} else {
		for _, p := range pages {
			if p != nil && p.Public == 1 && p.Slug != "" {
				slugs = append(slugs, p.Slug)
			}
		}
	}

	Default().Publish(evt, slugs)
}

func uptime1h(ctx context.Context, monitorID int64) *float64 {
	since := time.Now().UTC().Add(-time.Hour).Format("2006-01-02 15:04:05")
	stats, err := repo.GetRepository().GetCheckStatsByMonitorSince(ctx, mapping.GetCheckStatsByMonitorSinceParams{
		MonitorID: monitorID,
		Since:     since,
	})
	if err != nil || stats == nil || stats.Total <= 0 {
		return nil
	}
	pct := 100.0 * float64(stats.Ok) / float64(stats.Total)
	return &pct
}
