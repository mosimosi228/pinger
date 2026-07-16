package http_processor

import (
	"errors"
	"strings"
	"testing"
)

type sampleRequest struct {
	Name  string `json:"name" validate:"required,min=2"`
	Email string `json:"email" validate:"required,email"`
}

func TestValidateStructSuccess(t *testing.T) {
	req := sampleRequest{Name: "Alice", Email: "alice@example.com"}
	if err := ValidateStruct(&req); err != nil {
		t.Fatalf("ValidateStruct() error = %v, want nil", err)
	}
}

func TestValidateStructFailure(t *testing.T) {
	req := sampleRequest{Name: "A", Email: "bad-email"}
	err := ValidateStruct(&req)
	if err == nil {
		t.Fatal("ValidateStruct() error = nil, want validation error")
	}

	var ve *ValidationError
	if !errors.As(err, &ve) {
		t.Fatalf("error type = %T, want *ValidationError", err)
	}
	if len(ve.Details) == 0 {
		t.Fatal("expected validation details")
	}
	if !strings.Contains(err.Error(), "validation failed") {
		t.Fatalf("error = %q, want validation failed prefix", err.Error())
	}
}

func TestValidateStructNil(t *testing.T) {
	if err := ValidateStruct(nil); err != nil {
		t.Fatalf("ValidateStruct(nil) = %v, want nil", err)
	}
}

func TestValidationErrorEmptyDetails(t *testing.T) {
	err := (&ValidationError{}).Error()
	if err != "validation failed" {
		t.Fatalf("Error() = %q, want %q", err, "validation failed")
	}
}
