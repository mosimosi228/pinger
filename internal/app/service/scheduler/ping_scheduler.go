package scheduler

import (
	"context"
	"log/slog"
	"time"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

const (
	claimLimit    = 50
	claimTimeout  = 2 * time.Second
	schedulerTick = time.Second
)

// StartScheduler claims due monitors every schedulerTick and enqueues them on jobs.
func StartScheduler(ctx context.Context, jobs chan<- *mapping.Monitor) {
	ticker := time.NewTicker(schedulerTick)
	defer ticker.Stop()

	slog.Info("ping scheduler started")

	for {
		select {
		case <-ctx.Done():
			slog.Info("ping scheduler stopped")
			return
		case <-ticker.C:
			claimAndEnqueue(ctx, jobs)
		}
	}
}

func claimAndEnqueue(parent context.Context, jobs chan<- *mapping.Monitor) {
	ctx, cancel := context.WithTimeout(parent, claimTimeout)
	defer cancel()

	monitors, err := repo.GetRepository().ClaimDueMonitors(ctx, claimLimit)
	if err != nil {
		slog.Error("claim due monitors", slog.Any("err", err))
		return
	}
	if len(monitors) == 0 {
		return
	}

	for _, m := range monitors {
		select {
		case <-parent.Done():
			return
		case jobs <- m:
		}
	}
}
