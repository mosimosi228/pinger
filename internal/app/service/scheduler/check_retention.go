package scheduler

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

const (
	checkRetention       = time.Hour
	historyRetention     = 25 * time.Hour
	retentionTick        = 5 * time.Minute
	retentionTimeout     = 10 * time.Second
	sqliteDateTimeLayout = "2006-01-02 15:04:05"
)

// StartCheckRetention periodically deletes old checks, hourly uptime, and resolved incidents.
func StartCheckRetention(ctx context.Context) {
	ticker := time.NewTicker(retentionTick)
	defer ticker.Stop()

	slog.Info("check retention started", slog.Duration("keep_checks", checkRetention), slog.Duration("keep_history", historyRetention), slog.Duration("tick", retentionTick))
	purgeOldData(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("check retention stopped")
			return
		case <-ticker.C:
			purgeOldData(ctx)
		}
	}
}

func purgeOldData(parent context.Context) {
	ctx, cancel := context.WithTimeout(parent, retentionTimeout)
	defer cancel()

	now := time.Now().UTC()
	checksBefore := now.Add(-checkRetention).Format(sqliteDateTimeLayout)
	historyBefore := now.Add(-historyRetention).Format(sqliteDateTimeLayout)

	if err := repo.GetRepository().DeleteOldChecks(ctx, checksBefore); err != nil {
		slog.Error("delete old checks", slog.String("before", checksBefore), slog.Any("err", err))
	}
	if err := repo.GetRepository().DeleteOldMonitorUptimeHourly(ctx, historyBefore); err != nil {
		slog.Error("delete old hourly uptime", slog.String("before", historyBefore), slog.Any("err", err))
	}
	if err := repo.GetRepository().DeleteOldResolvedIncidents(ctx, sql.NullString{String: historyBefore, Valid: true}); err != nil {
		slog.Error("delete old resolved incidents", slog.String("before", historyBefore), slog.Any("err", err))
	}
}
