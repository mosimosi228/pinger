package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/request"
	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
	"github.com/mosimosi228/pinger/pkg/http_processor"
)

type StatusPageController struct{}

func (h *StatusPageController) List(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	items, err := repo.GetRepository().ListStatusPagesByUser(r.Context(), uid)
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	out := make([]answer.StatusPageResponse, 0, len(items))
	for _, sp := range items {
		out = append(out, answer.StatusPageFromModel(sp))
	}
	render.JSON(w, r, out)
}

func (h *StatusPageController) Create(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	var req request.CreateStatusPageRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	sp, err := repo.GetRepository().CreateStatusPage(r.Context(), mapping.CreateStatusPageParams{
		UserID: uid,
		Name:   req.Name,
		Slug:   req.Slug,
		Public: enabledOrDefault(req.Public, false),
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.StatusPage().Set(sp.ID, sp)
	cache.StatusPageBySlug().Set(sp.Slug, sp)
	render.Status(r, http.StatusCreated)
	render.JSON(w, r, answer.StatusPageFromModel(sp))
}

func (h *StatusPageController) Get(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	sp, err := repo.GetRepository().GetStatusPageByIdAndUser(r.Context(), mapping.GetStatusPageByIdAndUserParams{
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

	resp := answer.StatusPageFromModel(sp)
	monitors, _ := repo.GetRepository().ListMonitorsByStatusPage(r.Context(), sp.ID)
	for _, m := range monitors {
		resp.Monitors = append(resp.Monitors, enrichMonitor(r, m))
	}
	render.JSON(w, r, resp)
}

func (h *StatusPageController) Update(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	var req request.UpdateStatusPageRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	old, err := repo.GetRepository().GetStatusPageByIdAndUser(r.Context(), mapping.GetStatusPageByIdAndUserParams{ID: id, UserID: uid})
	if err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}

	sp, err := repo.GetRepository().UpdateStatusPage(r.Context(), mapping.UpdateStatusPageParams{
		Name:   ptrStringToNull(req.Name),
		Slug:   ptrStringToNull(req.Slug),
		Public: ptrBoolToNullInt64(req.Public),
		ID:     id,
		UserID: uid,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrNotFound)
			return
		}
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.StatusPage().Set(sp.ID, sp)
	cache.StatusPageBySlug().Invalidate(old.Slug)
	cache.StatusPageBySlug().Set(sp.Slug, sp)
	render.JSON(w, r, answer.StatusPageFromModel(sp))
}

func (h *StatusPageController) Delete(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	id, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	old, err := repo.GetRepository().GetStatusPageByIdAndUser(r.Context(), mapping.GetStatusPageByIdAndUserParams{ID: id, UserID: uid})
	if err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	if err := repo.GetRepository().DeleteStatusPage(r.Context(), mapping.DeleteStatusPageParams{ID: id, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	cache.StatusPage().Invalidate(id)
	cache.StatusPageBySlug().Invalidate(old.Slug)
	_ = render.Render(w, r, answer.Deleted)
}

func (h *StatusPageController) AttachMonitor(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	pageID, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	var req request.IDLinkRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	if _, err := repo.GetRepository().GetStatusPageByIdAndUser(r.Context(), mapping.GetStatusPageByIdAndUserParams{ID: pageID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	if _, err := repo.GetRepository().GetMonitorByIdAndUser(r.Context(), mapping.GetMonitorByIdAndUserParams{ID: req.ID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	if err := repo.GetRepository().AttachMonitorToStatusPage(r.Context(), mapping.AttachMonitorToStatusPageParams{
		StatusPageID: pageID, MonitorID: req.ID,
	}); err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	_ = render.Render(w, r, answer.OK)
}

func (h *StatusPageController) DetachMonitor(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r)
	if !ok {
		return
	}
	pageID, err := pathInt64(r, "id")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	monitorID, err := pathInt64(r, "monitorID")
	if err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}
	if _, err := repo.GetRepository().GetStatusPageByIdAndUser(r.Context(), mapping.GetStatusPageByIdAndUserParams{ID: pageID, UserID: uid}); err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}
	_ = repo.GetRepository().DetachMonitorFromStatusPage(r.Context(), mapping.DetachMonitorFromStatusPageParams{
		StatusPageID: pageID, MonitorID: monitorID,
	})
	_ = render.Render(w, r, answer.Deleted)
}

func (h *StatusPageController) PublicGet(w http.ResponseWriter, r *http.Request) {
	slug := pathString(r, "slug")
	if slug == "" {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}

	sp, err := repo.GetRepository().GetPublicStatusPageBySlug(r.Context(), slug)
	if err != nil {
		_ = render.Render(w, r, answer.ErrNotFound)
		return
	}

	monitors, err := repo.GetRepository().ListMonitorsByStatusPage(r.Context(), sp.ID)
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	since := time.Now().UTC().Add(-25 * time.Hour).Format("2006-01-02 15:04:05")
	resp := answer.PublicStatusPageResponse{
		Name:          sp.Name,
		Slug:          sp.Slug,
		OverallStatus: "operational",
		Monitors:      make([]answer.PublicMonitorResponse, 0, len(monitors)),
		Incidents:     []answer.PublicIncidentResponse{},
	}

	downCount := 0
	enabledCount := 0
	for _, m := range monitors {
		pub := enrichPublicMonitor(r, m)
		resp.Monitors = append(resp.Monitors, pub)
		if !pub.Enabled {
			continue
		}
		enabledCount++
		if pub.LastStatus != nil && !*pub.LastStatus {
			downCount++
		}

		incs, err := repo.GetRepository().ListIncidentsByMonitorIDsSince(r.Context(), mapping.ListIncidentsByMonitorIDsSinceParams{
			MonitorID: m.ID,
			Since:     since,
		})
		if err != nil {
			continue
		}
		for _, inc := range incs {
			item := answer.PublicIncidentResponse{
				ID:          inc.ID,
				MonitorID:   inc.MonitorID,
				MonitorName: inc.MonitorName,
				Title:       inc.Title,
				Message:     inc.Message,
				StartedAt:   inc.StartedAt,
			}
			if inc.ResolvedAt.Valid {
				item.ResolvedAt = inc.ResolvedAt.String
			}
			resp.Incidents = append(resp.Incidents, item)
		}
	}

	switch {
	case enabledCount == 0:
		resp.OverallStatus = "operational"
	case downCount == 0:
		resp.OverallStatus = "operational"
	case downCount >= enabledCount:
		resp.OverallStatus = "major_outage"
	default:
		resp.OverallStatus = "degraded"
	}

	render.JSON(w, r, resp)
}

func enrichPublicMonitor(r *http.Request, m *mapping.Monitor) answer.PublicMonitorResponse {
	full := enrichMonitor(r, m)
	return answer.PublicMonitorResponse{
		ID:          full.ID,
		Name:        full.Name,
		Type:        full.Type,
		Enabled:     full.Enabled,
		LastStatus:  full.LastStatus,
		LastLatency: full.LastLatency,
		LastChecked: full.LastChecked,
		Uptime1h:    full.Uptime1h,
		UptimeHours: buildUptimeHours(r, m.ID),
	}
}

func buildUptimeHours(r *http.Request, monitorID int64) []answer.PublicHourBucket {
	now := time.Now().UTC().Truncate(time.Hour)
	since := now.Add(-23 * time.Hour).Format("2006-01-02 15:04:05")
	rows, err := repo.GetRepository().ListMonitorUptimeHourlySince(r.Context(), mapping.ListMonitorUptimeHourlySinceParams{
		MonitorID: monitorID,
		Since:     since,
	})
	byHour := map[string]*mapping.MonitorUptimeHourly{}
	if err == nil {
		for _, row := range rows {
			byHour[row.HourStart] = row
		}
	}

	out := make([]answer.PublicHourBucket, 0, 24)
	for i := 23; i >= 0; i-- {
		h := now.Add(-time.Duration(i) * time.Hour)
		key := h.Format("2006-01-02 15:04:05")
		bucket := answer.PublicHourBucket{Hour: key, Total: 0}
		if row, ok := byHour[key]; ok && row.Total > 0 {
			pct := 100.0 * float64(row.Ok) / float64(row.Total)
			bucket.UptimePct = &pct
			bucket.Total = row.Total
		}
		out = append(out, bucket)
	}
	return out
}
