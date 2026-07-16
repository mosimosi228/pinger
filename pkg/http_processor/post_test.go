package http_processor

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGetSafeJsonBodySuccess(t *testing.T) {
	body := strings.NewReader(`{"name":"Alice","email":"alice@example.com"}`)
	req := httptest.NewRequest("POST", "/", body)

	var dst sampleRequest
	if err := GetSafeJsonBody(&dst)(req); err != nil {
		t.Fatalf("GetSafeJsonBody() error = %v", err)
	}

	if dst.Name != "Alice" || dst.Email != "alice@example.com" {
		t.Fatalf("decoded request = %+v, want Alice/alice@example.com", dst)
	}
}

func TestGetSafeJsonBodyValidationError(t *testing.T) {
	body := strings.NewReader(`{"name":"A","email":"bad"}`)
	req := httptest.NewRequest("POST", "/", body)

	var dst sampleRequest
	if err := GetSafeJsonBody(&dst)(req); err == nil {
		t.Fatal("GetSafeJsonBody() error = nil, want validation error")
	}
}

func TestGetSafeJsonBodyInvalidJSON(t *testing.T) {
	body := strings.NewReader(`{invalid`)
	req := httptest.NewRequest("POST", "/", body)

	var dst sampleRequest
	if err := GetSafeJsonBody(&dst)(req); err == nil {
		t.Fatal("GetSafeJsonBody() error = nil, want decode error")
	}
}

func TestGetSafeJsonBodyNilDestination(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{}`))
	if err := GetSafeJsonBody(nil)(req); err == nil {
		t.Fatal("GetSafeJsonBody(nil) error = nil, want error")
	}
}
