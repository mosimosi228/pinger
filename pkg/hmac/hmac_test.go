package hmac

import (
	"encoding/base64"
	"encoding/hex"
	"testing"
)

func TestSignAndVerify(t *testing.T) {
	secret := []byte("secret")
	message := []byte("hello")

	digest := Sign(secret, message)
	if !Verify(secret, message, digest) {
		t.Fatal("expected valid signature")
	}
	if Verify(secret, []byte("other"), digest) {
		t.Fatal("expected invalid signature for other message")
	}
}

func TestSignHex(t *testing.T) {
	secret := []byte("secret")
	message := []byte("hello")

	sig := SignHex(secret, message)
	if _, err := hex.DecodeString(sig); err != nil {
		t.Fatalf("hex decode: %v", err)
	}
	if !VerifyHex(secret, message, sig) {
		t.Fatal("expected VerifyHex to succeed")
	}
	if VerifyHex(secret, message, "deadbeef") {
		t.Fatal("expected VerifyHex to fail on wrong sig")
	}
}

func TestSignBase64URL(t *testing.T) {
	secret := []byte("secret")
	message := []byte("hello")

	sig := SignBase64URL(secret, message)
	if _, err := base64.RawURLEncoding.DecodeString(sig); err != nil {
		t.Fatalf("base64url decode: %v", err)
	}
	if !VerifyBase64URL(secret, message, sig) {
		t.Fatal("expected VerifyBase64URL to succeed")
	}
}

func TestEqual(t *testing.T) {
	fn := Equal
	if !fn("abc", "abc") {
		t.Fatal("expected equal")
	}
	if fn("abc", "abd") {
		t.Fatal("expected not equal")
	}
	if fn("abc", "abcd") {
		t.Fatal("expected length mismatch to fail")
	}
}
