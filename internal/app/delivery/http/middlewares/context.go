package middlewares

import (
	"context"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

type userCtxKeyType int

const userCtxKey userCtxKeyType = 1

// WithUser stores the user in context.
func WithUser(ctx context.Context, u *mapping.User) context.Context {
	return context.WithValue(ctx, userCtxKey, u)
}

// UserFromContext returns the current user.
func UserFromContext(ctx context.Context) (*mapping.User, bool) {
	u, ok := ctx.Value(userCtxKey).(*mapping.User)
	return u, ok
}

// UserIDFromContext returns the current user's ID.
func UserIDFromContext(ctx context.Context) (string, bool) {
	u, ok := UserFromContext(ctx)
	if !ok || u == nil || u.ID == "" {
		return "", false
	}
	return u.ID, true
}
