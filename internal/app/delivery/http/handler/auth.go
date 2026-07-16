package handler

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/middlewares"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/request"
	infracache "github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/internal/infra/db/repo"
	pkgauth "github.com/mosimosi228/pinger/pkg/auth"
	"github.com/mosimosi228/pinger/pkg/http_processor"
)

const roleUser = "user"

type AuthController struct{}

func (h *AuthController) Register(w http.ResponseWriter, r *http.Request) {
	var req request.RegisterRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	a := pkgauth.GetAuthManager(pkgauth.TypeJWT)
	if a == nil {
		_ = render.Render(w, r, answer.ErrInternalError(errors.New("auth: auth manager not found")))
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	username := strings.TrimSpace(req.Username)
	q := repo.GetRepository()

	if _, err := q.GetUserByEmail(r.Context(), email); err == nil {
		_ = render.Render(w, r, answer.ErrBadRequest(pkgauth.ErrUserExists))
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	if _, err := q.GetUserByUserName(r.Context(), username); err == nil {
		_ = render.Render(w, r, answer.ErrBadRequest(pkgauth.ErrUserExists))
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	hash, err := pkgauth.HashPassword(req.Password)
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	apiKey, err := pkgauth.GenerateAPIKey()
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(fmt.Errorf("auth: api key: %w", err)))
		return
	}

	user, err := q.CreateUser(r.Context(), mapping.CreateUserParams{
		Email:        email,
		Username:     username,
		PasswordHash: hash,
		Role:         roleUser,
		ApiKey:       sql.NullString{String: apiKey, Valid: true},
	})
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(fmt.Errorf("auth: create user: %w", err)))
		return
	}

	h.renderTokens(w, r, a, user)
}

func (h *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var req request.LoginRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	a := pkgauth.GetAuthManager(pkgauth.TypeJWT)
	if a == nil {
		_ = render.Render(w, r, answer.ErrInternalError(errors.New("auth: auth manager not found")))
		return
	}

	user, err := h.findByLogin(r.Context(), strings.TrimSpace(req.Login))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrUnauthorized)
			return
		}
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	if user.Status != "active" {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}
	if err := pkgauth.CheckPassword(user.PasswordHash, req.Password); err != nil {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}

	ip := r.RemoteAddr
	_ = repo.GetRepository().UpdateLastLogin(r.Context(), mapping.UpdateLastLoginParams{
		ID: user.ID,
		Ip: sql.NullString{String: ip, Valid: ip != ""},
	})

	h.renderTokens(w, r, a, user)
}

func (h *AuthController) Refresh(w http.ResponseWriter, r *http.Request) {
	var req request.RefreshRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	a := pkgauth.GetAuthManager(pkgauth.TypeJWT)
	if a == nil {
		_ = render.Render(w, r, answer.ErrInternalError(errors.New("auth: auth manager not found")))
		return
	}

	sub, err := a.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}

	user, err := repo.GetRepository().GetUserById(r.Context(), sub)
	if err != nil || user.Status != "active" {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}

	h.renderTokens(w, r, a, user)
}

func (h *AuthController) Me(w http.ResponseWriter, r *http.Request) {
	u, ok := middlewares.UserFromContext(r.Context())
	if !ok {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}
	render.JSON(w, r, meFromUser(u))
}

func (h *AuthController) UpdateMe(w http.ResponseWriter, r *http.Request) {
	u, ok := middlewares.UserFromContext(r.Context())
	if !ok {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return
	}

	var req request.UpdateMeRequest
	if err := http_processor.GetSafeJsonBody(&req)(r); err != nil {
		_ = render.Render(w, r, answer.ErrBadRequest(err))
		return
	}

	params := mapping.UpdateUserParams{ID: u.ID}
	q := repo.GetRepository()

	if req.Email != nil {
		email := strings.TrimSpace(strings.ToLower(*req.Email))
		if email == "" {
			_ = render.Render(w, r, answer.ErrBadRequest(errors.New("email is required")))
			return
		}
		if existing, err := q.GetUserByEmail(r.Context(), email); err == nil && existing.ID != u.ID {
			_ = render.Render(w, r, answer.ErrBadRequest(pkgauth.ErrUserExists))
			return
		} else if err != nil && !errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrInternalError(err))
			return
		}
		params.Email = sql.NullString{String: email, Valid: true}
	}

	if req.Username != nil {
		username := strings.TrimSpace(*req.Username)
		if username == "" {
			_ = render.Render(w, r, answer.ErrBadRequest(errors.New("username is required")))
			return
		}
		if existing, err := q.GetUserByUserName(r.Context(), username); err == nil && existing.ID != u.ID {
			_ = render.Render(w, r, answer.ErrBadRequest(pkgauth.ErrUserExists))
			return
		} else if err != nil && !errors.Is(err, sql.ErrNoRows) {
			_ = render.Render(w, r, answer.ErrInternalError(err))
			return
		}
		params.Username = sql.NullString{String: username, Valid: true}
	}

	if req.Password != nil && *req.Password != "" {
		if req.CurrentPassword == nil || *req.CurrentPassword == "" {
			_ = render.Render(w, r, answer.ErrBadRequest(errors.New("current_password is required to change password")))
			return
		}
		if err := pkgauth.CheckPassword(u.PasswordHash, *req.CurrentPassword); err != nil {
			_ = render.Render(w, r, answer.ErrBadRequest(errors.New("current password is incorrect")))
			return
		}
		hash, err := pkgauth.HashPassword(*req.Password)
		if err != nil {
			_ = render.Render(w, r, answer.ErrInternalError(err))
			return
		}
		params.PasswordHash = sql.NullString{String: hash, Valid: true}
	}

	if req.RegenerateAPIKey != nil && *req.RegenerateAPIKey {
		key, err := pkgauth.GenerateAPIKey()
		if err != nil {
			_ = render.Render(w, r, answer.ErrInternalError(err))
			return
		}
		params.ApiKey = sql.NullString{String: key, Valid: true}
	}

	updated, err := q.UpdateUser(r.Context(), params)
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}

	infracache.User().Set(updated.ID, updated)
	render.JSON(w, r, meFromUser(updated))
}

func meFromUser(u *mapping.User) answer.MeResponse {
	apiKey := ""
	if u.ApiKey.Valid {
		apiKey = u.ApiKey.String
	}
	return answer.MeResponse{
		ID:       u.ID,
		Email:    u.Email,
		Username: u.Username,
		Role:     u.Role,
		Status:   u.Status,
		APIKey:   apiKey,
	}
}

func (h *AuthController) findByLogin(ctx context.Context, login string) (*mapping.User, error) {
	q := repo.GetRepository()
	if u, err := q.GetUserByEmail(ctx, login); err == nil {
		return u, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	return q.GetUserByUserName(ctx, login)
}

func (h *AuthController) renderTokens(w http.ResponseWriter, r *http.Request, tokens *pkgauth.Auth, user *mapping.User) {
	access, refresh, err := tokens.GenerateTokens(user.ID)
	if err != nil {
		_ = render.Render(w, r, answer.ErrInternalError(err))
		return
	}
	_ = render.Render(w, r, &answer.TokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		TokenType:    "Bearer",
	})
}
