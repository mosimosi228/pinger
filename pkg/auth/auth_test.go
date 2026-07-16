package auth

import (
	"errors"
	"testing"
	"time"
)

func TestJWTRoundTrip(t *testing.T) {
	a, err := New(Config{
		Type:      TypeJWT,
		JWTSecret: "test-secret-32-bytes-minimum!!",
		AccessTTL: time.Hour,
	})
	if err != nil {
		t.Fatal(err)
	}

	access, refresh, err := a.GenerateTokens("user-1")
	if err != nil {
		t.Fatal(err)
	}

	sub, err := a.ParseJWT(access)
	if err != nil || sub != "user-1" {
		t.Fatalf("ParseJWT: sub=%q err=%v", sub, err)
	}

	sub, err = a.ParseRefreshToken(refresh)
	if err != nil || sub != "user-1" {
		t.Fatalf("ParseRefreshToken: sub=%q err=%v", sub, err)
	}

	if _, err := a.ParseJWT(refresh); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("refresh as access: want ErrInvalidToken, got %v", err)
	}
}

func TestAPIKey(t *testing.T) {
	key, err := GenerateAPIKey()
	if err != nil {
		t.Fatal(err)
	}

	a, err := New(Config{Type: TypeAPIKey, APIKey: key})
	if err != nil {
		t.Fatal(err)
	}

	if err := a.VerifyAPIKey(key); err != nil {
		t.Fatal(err)
	}
	if err := a.VerifyAPIKey("wrong"); !errors.Is(err, ErrInvalidAPIKey) {
		t.Fatalf("want ErrInvalidAPIKey, got %v", err)
	}

	eq := EqualAPIKey
	if !eq(key, key) {
		t.Fatal("equal expected true")
	}
	if eq(key, "nope") {
		t.Fatal("equal expected false")
	}
}
