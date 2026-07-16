package scheduler

import (
	"context"
	"log/slog"
	"time"

	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

const (
	checkRetention       = time.Hour
	retentionTick        = 5 * time.Minute
	retentionTimeout     = 10 * time.Second
	sqliteDateTimeLayout = "2006-01-02 15:04:05"
)

// StartCheckRetention periodically deletes checks older than checkRetention.
func StartCheckRetention(ctx context.Context) {
	ticker := time.NewTicker(retentionTick)
	defer ticker.Stop()

	slog.Info("check retention started", slog.Duration("keep", checkRetention), slog.Duration("tick", retentionTick))
	purgeOldChecks(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("check retention stopped")
			return
		case <-ticker.C:
			purgeOldChecks(ctx)
		}
	}
}

func purgeOldChecks(parent context.Context) {
	ctx, cancel := context.WithTimeout(parent, retentionTimeout)
	defer cancel()

	before := time.Now().UTC().Add(-checkRetention).Format(sqliteDateTimeLayout)
	if err := repo.GetRepository().DeleteOldChecks(ctx, before); err != nil {
		slog.Error("delete old checks", slog.String("before", before), slog.Any("err", err))
		return
	}
}
