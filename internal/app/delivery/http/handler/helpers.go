package handler

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/middlewares"
)

func requireUserID(w http.ResponseWriter, r *http.Request) (string, bool) {
	uid, ok := middlewares.UserIDFromContext(r.Context())
	if !ok {
		_ = render.Render(w, r, answer.ErrUnauthorized)
		return "", false
	}
	return uid, true
}

func pathInt64(r *http.Request, name string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, name), 10, 64)
}

func pathString(r *http.Request, name string) string {
	return chi.URLParam(r, name)
}

func boolToInt64(v bool) int64 {
	if v {
		return 1
	}
	return 0
}

func ptrBoolToNullInt64(v *bool) sql.NullInt64 {
	if v == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: boolToInt64(*v), Valid: true}
}

func ptrStringToNull(v *string) sql.NullString {
	if v == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *v, Valid: true}
}

func ptrInt64ToNull(v *int64) sql.NullInt64 {
	if v == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: *v, Valid: true}
}

func enabledOrDefault(v *bool, def bool) int64 {
	if v == nil {
		return boolToInt64(def)
	}
	return boolToInt64(*v)
}

func intOrDefault(v *int64, def int64) int64 {
	if v == nil {
		return def
	}
	return *v
}
