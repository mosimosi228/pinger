package handler

import (
	"net/http"

	"github.com/mosimosi228/kit/auth"
	"github.com/mosimosi228/pinger/internal/app/service/live"
	"github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
)

type LiveController struct{}

// User — GET /api/v1/ws?token=<access JWT>
func (h *LiveController) User(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "token required", http.StatusUnauthorized)
		return
	}

	manager := auth.GetAuthManager(auth.TypeJWT)
	if manager == nil {
		http.Error(w, "auth unavailable", http.StatusServiceUnavailable)
		return
	}
	sub, err := manager.ParseJWT(token)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := cache.User().GetOrLoad(sub, func() (*mapping.User, error) {
		return repo.GetRepository().GetUserById(r.Context(), sub)
	})
	if err != nil || user.Status != "active" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	c := live.Default().SubscribeUser(user.ID)
	live.ServeWS(w, r, c, user.ID, "")
}

// PublicSlug — GET /api/public/ws/s/{slug}
func (h *LiveController) PublicSlug(w http.ResponseWriter, r *http.Request) {
	slug := pathString(r, "slug")
	if slug == "" {
		http.Error(w, "slug required", http.StatusBadRequest)
		return
	}

	sp, err := cache.StatusPageBySlug().GetOrLoad(slug, func() (*mapping.StatusPage, error) {
		return repo.GetRepository().GetPublicStatusPageBySlug(r.Context(), slug)
	})
	if err != nil || sp.Public != 1 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	c := live.Default().SubscribeSlug(slug)
	live.ServeWS(w, r, c, "", slug)
}
