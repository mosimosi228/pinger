package handler

import (
	"context"
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/render"
	"github.com/mosimosi228/kit/http_processor"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/request"
	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

type NotificationController struct{}

func (h *NotificationController) List(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	items, err := cache.NotificationsByUser().GetOrLoad(uid, func() ([]*mapping.Notification, error) {
		return repo.GetRepository().ListNotificationsByUser(r.Context(), uid)
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	out := make([]answer.NotificationResponse, 0, len(items))
	for _, n := range items {
		out = append(out, answer.NotificationFromModel(n))
	}
	render.JSON(w, r, out)
}

func (h *NotificationController) Create(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	var req request.CreateNotificationRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	n, err := repo.GetRepository().CreateNotification(r.Context(), mapping.CreateNotificationParams{
		UserID:  uid,
		Type:    req.Type,
		Config:  req.Config,
		Enabled: enabledOrDefault(req.Enabled, true),
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.Notification().Set(n.ID, n)
	cache.NotificationsByUser().Invalidate(uid)
	render.Status(r, http.StatusCreated)
	render.JSON(w, r, answer.NotificationFromModel(n))
}

func (h *NotificationController) Get(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	n, err := repo.GetRepository().GetNotificationByIdAndUser(r.Context(), mapping.GetNotificationByIdAndUserParams{
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
	render.JSON(w, r, answer.NotificationFromModel(n))
}

func (h *NotificationController) Update(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	var req request.UpdateNotificationRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	n, err := repo.GetRepository().UpdateNotification(r.Context(), mapping.UpdateNotificationParams{
		Type:    ptrStringToNull(req.Type),
		Config:  ptrStringToNull(req.Config),
		Enabled: ptrBoolToNullInt64(req.Enabled),
		ID:      id,
		UserID:  uid,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrNotFound)
			return
		}
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.Notification().Set(n.ID, n)
	invalidateNotificationCaches(r.Context(), uid, id)
	render.JSON(w, r, answer.NotificationFromModel(n))
}

func (h *NotificationController) Delete(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	// Invalidate monitor caches before CASCADE removes join rows.
	invalidateNotificationCaches(r.Context(), uid, id)
	if err := repo.GetRepository().DeleteNotification(r.Context(), mapping.DeleteNotificationParams{ID: id, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	_ = render.Render(w, r, answer.Deleted)
}

func invalidateNotificationCaches(ctx context.Context, uid string, notificationID int64) {
	cache.Notification().Invalidate(notificationID)
	cache.NotificationsByUser().Invalidate(uid)
	monitors, err := repo.GetRepository().ListMonitorsByNotification(ctx, notificationID)
	if err != nil {
		return
	}
	for _, m := range monitors {
		cache.NotificationsByMonitor().Invalidate(m.ID)
	}
}
