package http_processor

import (
	"context"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type queryRequest struct {
	Page   int    `query:"page" default:"1"`
	Search string `query:"search"`
	ID     string `query:"id" validate:"required,uuid4"`
}

type routeRequest struct {
	UserID string `param:"user_id" validate:"required"`
	Active bool   `query:"active" default:"true"`
}

func TestGetSafeQueryBindsQueryAndDefaults(t *testing.T) {
	id := uuid.NewString()
	req := httptest.NewRequest("GET", "/?id="+id+"&search=hello", nil)

	var dst queryRequest
	if err := GetSafeQuery(&dst)(req); err != nil {
		t.Fatalf("GetSafeQuery() error = %v", err)
	}

	if dst.Page != 1 {
		t.Fatalf("Page = %d, want default 1", dst.Page)
	}
	if dst.Search != "hello" {
		t.Fatalf("Search = %q, want hello", dst.Search)
	}
	if dst.ID != id {
		t.Fatalf("ID = %q, want %q", dst.ID, id)
	}
}

func TestGetSafeQueryValidationError(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)

	var dst queryRequest
	if err := GetSafeQuery(&dst)(req); err == nil {
		t.Fatal("GetSafeQuery() error = nil, want validation error")
	}
}

func TestGetSafeQueryBindsRouteParam(t *testing.T) {
	req := httptest.NewRequest("GET", "/users/42", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("user_id", "42")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	var dst routeRequest
	if err := GetSafeQuery(&dst)(req); err != nil {
		t.Fatalf("GetSafeQuery() error = %v", err)
	}

	if dst.UserID != "42" {
		t.Fatalf("UserID = %q, want 42", dst.UserID)
	}
	if !dst.Active {
		t.Fatal("Active = false, want default true")
	}
}

func TestGetSafeQueryInvalidDestinationPanics(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("expected panic for invalid destination type")
		}
	}()

	GetSafeQuery(queryRequest{})
}
