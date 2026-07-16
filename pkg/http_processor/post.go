package http_processor

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

// GetSafeJsonBody decodes the JSON body into dst and validates it.
// dst must be a pointer to a struct: var req MyReq; GetSafeJsonBody(&req)(r)
func GetSafeJsonBody(dst any) func(r *http.Request) error {
	return func(r *http.Request) error {
		if dst == nil {
			return errors.New("dst cannot be nil")
		}

		if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
			return fmt.Errorf("json decode failed: %w", err)
		}

		return ValidateStruct(dst)
	}
}
