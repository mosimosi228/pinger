package auth

import (
	"crypto/rand"
	"encoding/hex"

	hmacutil "github.com/mosimosi228/pinger/pkg/hmac"
)

const apiKeyBytes = 32

// GenerateAPIKey creates a random API token (hex, 64 characters).
func GenerateAPIKey() (string, error) {
	buf := make([]byte, apiKeyBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

// VerifyAPIKey compares the key against the global API key from Config (api_key mode).
func (a *Auth) VerifyAPIKey(key string) error {
	if a.cfg.APIKey == "" {
		return ErrNotConfigured
	}
	if !hmacutil.Equal(key, a.cfg.APIKey) {
		return ErrInvalidAPIKey
	}
	return nil
}

// EqualAPIKey performs constant-time comparison of two keys (per-user api_key from DB).
func EqualAPIKey(provided, stored string) bool {
	if provided == "" || stored == "" {
		return false
	}
	return hmacutil.Equal(provided, stored)
}

// HashAPIKey returns HMAC-SHA256(hex) of the key using the JWT/HMAC secret.
// Useful when storing a hash in the DB instead of plaintext.
func (a *Auth) HashAPIKey(apiKey string) (string, error) {
	secret := a.cfg.JWTSecret
	if secret == "" {
		secret = a.cfg.APIKey
	}
	if secret == "" {
		return "", ErrNotConfigured
	}
	return hmacutil.SignHex([]byte(secret), []byte(apiKey)), nil
}
