package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/render"
	"github.com/mosimosi228/kit/http_processor"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/request"
	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

type MonitorController struct{}

type monitorDetailResponse struct {
	answer.MonitorResponse
	Notifications []answer.NotificationResponse `json:"notifications"`
}

func (h *MonitorController) List(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}

	items, err := cache.MonitorsByUser().GetOrLoad(uid, func() ([]*mapping.Monitor, error) {
		return repo.GetRepository().ListMonitorsByUser(r.Context(), uid)
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	out := make([]answer.MonitorResponse, 0, len(items))
	for _, m := range items {
		out = append(out, enrichMonitor(r, m))
	}
	render.JSON(w, r, out)
}

func (h *MonitorController) Create(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	var req request.CreateMonitorRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	m, err := repo.GetRepository().CreateMonitor(r.Context(), mapping.CreateMonitorParams{
		UserID:        uid,
		Name:          req.Name,
		Type:          req.Type,
		Target:        req.Target,
		Interval:      req.Interval,
		Timeout:       req.Timeout,
		Enabled:       enabledOrDefault(req.Enabled, true),
		Confirmations: intOrDefault(req.Confirmations, 1),
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	cache.Monitor().Set(m.ID, m)
	cache.MonitorsByUser().Invalidate(uid)
	render.Status(r, http.StatusCreated)
	render.JSON(w, r, answer.MonitorFromModel(m))
}

func (h *MonitorController) Get(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	m, err := repo.GetRepository().GetMonitorByIdAndUser(r.Context(), mapping.GetMonitorByIdAndUserParams{
		ID: id, UserID: uid,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrNotFound)
			return
		}
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	detail := monitorDetailResponse{
		MonitorResponse: enrichMonitor(r, m),
		Notifications:   []answer.NotificationResponse{},
	}
	if notifs, err := repo.GetRepository().ListNotificationsByMonitor(r.Context(), m.ID); err == nil {
		for _, n := range notifs {
			detail.Notifications = append(detail.Notifications, answer.NotificationFromModel(n))
		}
	}
	render.JSON(w, r, detail)
}

func (h *MonitorController) Update(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	var req request.UpdateMonitorRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	m, err := repo.GetRepository().UpdateMonitor(r.Context(), mapping.UpdateMonitorParams{
		Name:          ptrStringToNull(req.Name),
		Type:          ptrStringToNull(req.Type),
		Target:        ptrStringToNull(req.Target),
		Interval:      ptrInt64ToNull(req.Interval),
		Timeout:       ptrInt64ToNull(req.Timeout),
		Enabled:       ptrBoolToNullInt64(req.Enabled),
		Confirmations: ptrInt64ToNull(req.Confirmations),
		ID:            id,
		UserID:        uid,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrNotFound)
			return
		}
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	cache.Monitor().Set(m.ID, m)
	cache.MonitorsByUser().Invalidate(uid)
	render.JSON(w, r, answer.MonitorFromModel(m))
}

func (h *MonitorController) Delete(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	if err := repo.GetRepository().DeleteMonitor(r.Context(), mapping.DeleteMonitorParams{ID: id, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.Monitor().Invalidate(id)
	cache.MonitorsByUser().Invalidate(uid)
	cache.LatestCheck().Invalidate(id)
	cache.NotificationsByMonitor().Invalidate(id)
	_ = render.Render(w, r, answer.Deleted)
}

func (h *MonitorController) AttachNotification(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	monitorID, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	var req request.IDLinkRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	if _, err := repo.GetRepository().GetMonitorByIdAndUser(r.Context(), mapping.GetMonitorByIdAndUserParams{ID: monitorID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	if _, err := repo.GetRepository().GetNotificationByIdAndUser(r.Context(), mapping.GetNotificationByIdAndUserParams{ID: req.ID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}

	if err := repo.GetRepository().AttachNotificationToMonitor(r.Context(), mapping.AttachNotificationToMonitorParams{
		MonitorID: monitorID, NotificationID: req.ID,
	}); err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.NotificationsByMonitor().Invalidate(monitorID)
	_ = render.Render(w, r, answer.OK)
}

func (h *MonitorController) DetachNotification(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	monitorID, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	notifID, err := pathInt64(r, "notificationID")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	if _, err := repo.GetRepository().GetMonitorByIdAndUser(r.Context(), mapping.GetMonitorByIdAndUserParams{ID: monitorID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	_ = repo.GetRepository().DetachNotificationFromMonitor(r.Context(), mapping.DetachNotificationFromMonitorParams{
		MonitorID: monitorID, NotificationID: notifID,
	})
	cache.NotificationsByMonitor().Invalidate(monitorID)
	_ = render.Render(w, r, answer.Deleted)
}

type CheckController struct{}

func (h *CheckController) ListByMonitor(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	monitorID, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	if _, err := repo.GetRepository().GetMonitorByIdAndUser(r.Context(), mapping.GetMonitorByIdAndUserParams{ID: monitorID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}

	limit := int64(50)
	if q := r.URL.Query().Get("limit"); q != "" {
		if v, e := strconv.ParseInt(q, 10, 64); e == nil && v > 0 && v <= 500 {
			limit = v
		}
	}

	items, err := repo.GetRepository().ListChecksByMonitor(r.Context(), mapping.ListChecksByMonitorParams{
		MonitorID: monitorID, LimitCount: limit,
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	out := make([]answer.CheckResponse, 0, len(items))
	for _, c := range items {
		out = append(out, answer.CheckFromModel(c))
	}
	render.JSON(w, r, out)
}

func enrichMonitor(r *http.Request, m *mapping.Monitor) answer.MonitorResponse {
	row := answer.MonitorFromModel(m)
	c, err := cache.LatestCheck().GetOrLoad(m.ID, func() (*mapping.Check, error) {
		return repo.GetRepository().GetLatestCheckByMonitor(r.Context(), m.ID)
	})
	if err == nil && c != nil {
		st := c.Status == 1
		row.LastStatus = &st
		row.LastChecked = c.CheckedAt
		if c.Latency.Valid {
			v := c.Latency.Int64
			row.LastLatency = &v
		}
	}

	since := time.Now().UTC().Add(-time.Hour).Format("2006-01-02 15:04:05")
	stats, err := repo.GetRepository().GetCheckStatsByMonitorSince(r.Context(), mapping.GetCheckStatsByMonitorSinceParams{
		MonitorID: m.ID,
		Since:     since,
	})
	if err == nil && stats != nil && stats.Total > 0 {
		pct := 100.0 * float64(stats.Ok) / float64(stats.Total)
		row.Uptime1h = &pct
	}
	return row
}
