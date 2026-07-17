package worker

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"time"

	"github.com/mosimosi228/pinger/internal/app/service/live"
	"github.com/mosimosi228/pinger/internal/app/service/notify"
	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

type CheckResult struct {
	OK         bool
	StatusCode int
	LatencyMS  int
	Err        string
}

// RunPingWorker reads monitors from the queue and runs checks.
func RunPingWorker(ctx context.Context, jobs <-chan *mapping.Monitor) {
	for {
		select {
		case <-ctx.Done():
			return
		case monitor, ok := <-jobs:
			if !ok {
				return
			}
			if monitor == nil {
				continue
			}
			runCheck(ctx, monitor)
		}
	}
}

func runCheck(parent context.Context, monitor *mapping.Monitor) {
	timeout := time.Duration(monitor.Timeout) * time.Second
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	var result CheckResult
	switch monitor.Type {
	case "HTTP":
		result = pingHTTP(ctx, monitor)
	case "TCP":
		result = pingTCP(ctx, monitor)
	case "ICMP":
		result = pingICMP(ctx, monitor)
	default:
		result = CheckResult{OK: false, Err: "unknown monitor type: " + monitor.Type}
	}

	status := int64(0)
	if result.OK {
		status = 1
	}

	params := mapping.CreateCheckParams{
		MonitorID: monitor.ID,
		Status:    status,
	}
	if result.StatusCode > 0 {
		params.StatusCode = sql.NullInt64{Int64: int64(result.StatusCode), Valid: true}
	}
	if result.LatencyMS > 0 || result.OK {
		params.Latency = sql.NullInt64{Int64: int64(result.LatencyMS), Valid: true}
	}
	if result.Err != "" {
		params.Error = sql.NullString{String: result.Err, Valid: true}
	}

	dbCtx, dbCancel := context.WithTimeout(parent, 3*time.Second)
	defer dbCancel()

	check, err := repo.GetRepository().CreateCheck(dbCtx, params)
	if err != nil {
		slog.Error("create check", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
		return
	}

	recordHourlyUptime(dbCtx, monitor.ID, status == 1)

	cache.LatestCheck().Set(monitor.ID, check)

	live.PublishCheck(parent, monitor, check)

	needed := monitor.Confirmations
	if needed < 1 {
		needed = 1
	}
	shouldAlert, prev := confirmedStatusChange(dbCtx, monitor.ID, needed)
	if shouldAlert {
		syncIncident(dbCtx, monitor, check)
		if err := notify.OnStatusChange(parent, monitor, prev, check); err != nil && !errors.Is(err, context.Canceled) {
			slog.Warn("notify failed", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
		}
	}
}

func recordHourlyUptime(ctx context.Context, monitorID int64, ok bool) {
	hourStart := time.Now().UTC().Truncate(time.Hour).Format("2006-01-02 15:04:05")
	okInc := int64(0)
	if ok {
		okInc = 1
	}
	if err := repo.GetRepository().UpsertMonitorUptimeHourly(ctx, mapping.UpsertMonitorUptimeHourlyParams{
		MonitorID: monitorID,
		HourStart: hourStart,
		OkInc:     okInc,
	}); err != nil {
		slog.Debug("upsert hourly uptime", slog.Int64("monitor_id", monitorID), slog.Any("err", err))
	}
}

func syncIncident(ctx context.Context, monitor *mapping.Monitor, check *mapping.Check) {
	if check.Status == 1 {
		if _, err := repo.GetRepository().ResolveOpenIncidentByMonitor(ctx, monitor.ID); err != nil && !errors.Is(err, sql.ErrNoRows) {
			slog.Debug("resolve incident", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
		}
		return
	}

	msg := "service is down"
	if check.Error.Valid && check.Error.String != "" {
		msg = check.Error.String
	}
	title := monitor.Name + " is down"
	if _, err := repo.GetRepository().GetOpenIncidentByMonitor(ctx, monitor.ID); err == nil {
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		slog.Debug("get open incident", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
		return
	}
	if _, err := repo.GetRepository().CreateIncident(ctx, mapping.CreateIncidentParams{
		MonitorID: monitor.ID,
		Title:     title,
		Message:   msg,
	}); err != nil {
		slog.Debug("create incident", slog.Int64("monitor_id", monitor.ID), slog.Any("err", err))
	}
}

// confirmedStatusChange loads recent checks and decides whether the newest one
// completes a confirmed transition that should trigger an alert.
func confirmedStatusChange(ctx context.Context, monitorID, needed int64) (bool, *mapping.Check) {
	since := time.Now().UTC().Add(-time.Hour).Format("2006-01-02 15:04:05")
	recent, err := repo.GetRepository().ListChecksByMonitorSince(ctx, mapping.ListChecksByMonitorSinceParams{
		MonitorID: monitorID,
		Since:     since,
	})
	if err != nil {
		slog.Debug("list checks for confirmations", slog.Int64("monitor_id", monitorID), slog.Any("err", err))
		return false, nil
	}
	return evaluateConfirmations(recent, needed)
}

// evaluateConfirmations walks checks (newest-first) and returns whether the
// newest check should alert, plus the last check of the previous status.
//
// Rules:
//   - First confirmed UP is a silent baseline (no alert).
//   - First confirmed DOWN alerts.
//   - Later alerts only on transitions between already-confirmed states,
//     each side requiring `needed` consecutive checks.
//   - A flap that never reaches `needed` on one side must not alert the other.
func evaluateConfirmations(newestFirst []*mapping.Check, needed int64) (bool, *mapping.Check) {
	if needed < 1 {
		needed = 1
	}
	if len(newestFirst) == 0 {
		return false, nil
	}

	checks := make([]*mapping.Check, len(newestFirst))
	for i, c := range newestFirst {
		checks[len(newestFirst)-1-i] = c
	}

	var (
		confirmed    sql.NullInt64
		streak       int64
		lastStatus   int64 = -1
		alertCurrent bool
		prevForAlert *mapping.Check
	)

	for i, c := range checks {
		if lastStatus < 0 || c.Status != lastStatus {
			streak = 1
			lastStatus = c.Status
		} else {
			streak++
		}
		if streak != needed {
			continue
		}

		isNewest := i == len(checks)-1
		var prev *mapping.Check
		if i >= int(needed) {
			prev = checks[i-int(needed)]
		}

		if !confirmed.Valid {
			if c.Status == 1 {
				// Establish UP baseline without notifying.
				confirmed = sql.NullInt64{Int64: 1, Valid: true}
				continue
			}
			confirmed = sql.NullInt64{Int64: 0, Valid: true}
			if isNewest {
				alertCurrent = true
				prevForAlert = prev
			}
			continue
		}

		if confirmed.Int64 == c.Status {
			continue
		}

		confirmed = sql.NullInt64{Int64: c.Status, Valid: true}
		if isNewest {
			alertCurrent = true
			prevForAlert = prev
		}
	}

	return alertCurrent, prevForAlert
}
