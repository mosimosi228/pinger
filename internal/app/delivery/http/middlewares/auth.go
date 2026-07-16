package middlewares

import (
	"context"
	"database/sql"
	"net/http"
	"slices"
	"strings"

	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	infracache "github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
	pkgauth "github.com/mosimosi228/pinger/pkg/auth"
)

// RequireAuth accepts Authorization: Bearer <access> or X-API-Key.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		if user, ok := fromBearer(ctx, r.Header.Get("Authorization")); ok {
			next.ServeHTTP(w, r.WithContext(WithUser(ctx, user)))
			return
		}

		if user, ok := fromAPIKey(ctx, r.Header.Get("X-API-Key")); ok {
			next.ServeHTTP(w, r.WithContext(WithUser(ctx, user)))
			return
		}

		_ = render.Render(w, r, answer.ErrUnauthorized)
	})
}

// RequireRole checks the user's role.
func RequireRole(roles []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := UserFromContext(r.Context())
			if !ok || !slices.Contains(roles, user.Role) {
				_ = render.Render(w, r, answer.ErrForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func fromBearer(ctx context.Context, header string) (*mapping.User, bool) {
	if header == "" {
		return nil, false
	}
	token, ok := strings.CutPrefix(header, "Bearer ")
	if !ok || token == "" {
		return nil, false
	}

	manager := pkgauth.GetAuthManager(pkgauth.TypeJWT)
	if manager == nil {
		return nil, false
	}

	sub, err := manager.ParseJWT(token)
	if err != nil {
		return nil, false
	}

	user, err := infracache.User().GetOrLoad(sub, func() (*mapping.User, error) {
		return repo.GetRepository().GetUserById(ctx, sub)
	})
	if err != nil || user.Status != "active" {
		return nil, false
	}
	return user, true
}

func fromAPIKey(ctx context.Context, apiKey string) (*mapping.User, bool) {
	if apiKey == "" {
		return nil, false
	}

	if a := pkgauth.GetAuthManager(pkgauth.TypeAPIKey); a != nil && a.VerifyAPIKey(apiKey) == nil {
		return &mapping.User{
			ID:     "service",
			Role:   "admin",
			Status: "active",
		}, true
	}

	cacheKey := "api:" + apiKey
	user, err := infracache.User().GetOrLoad(cacheKey, func() (*mapping.User, error) {
		return repo.GetRepository().GetUserByAPIKey(ctx, sql.NullString{String: apiKey, Valid: true})
	})
	if err != nil || user.Status != "active" {
		return nil, false
	}
	return user, true
}
