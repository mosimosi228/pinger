package hmac

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
)

var ErrInvalidSignature = errors.New("hmac: invalid signature")

// Sign returns raw HMAC-SHA256 digest of message with secret.
func Sign(secret, message []byte) []byte {
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write(message)
	return mac.Sum(nil)
}

// SignHex returns hex-encoded HMAC-SHA256.
func SignHex(secret, message []byte) string {
	return hex.EncodeToString(Sign(secret, message))
}

// SignBase64 returns standard base64-encoded HMAC-SHA256.
func SignBase64(secret, message []byte) string {
	return base64.StdEncoding.EncodeToString(Sign(secret, message))
}

// SignBase64URL returns base64url-encoded HMAC-SHA256 (no padding).
func SignBase64URL(secret, message []byte) string {
	return base64.RawURLEncoding.EncodeToString(Sign(secret, message))
}

// Verify compares digest with HMAC-SHA256(secret, message) in constant time.
func Verify(secret, message, digest []byte) bool {
	expected := Sign(secret, message)
	if len(digest) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare(digest, expected) == 1
}

// VerifyHex verifies a hex-encoded signature.
func VerifyHex(secret, message []byte, signature string) bool {
	digest, err := hex.DecodeString(signature)
	if err != nil {
		return false
	}
	return Verify(secret, message, digest)
}

// VerifyBase64 verifies a standard base64-encoded signature.
func VerifyBase64(secret, message []byte, signature string) bool {
	digest, err := base64.StdEncoding.DecodeString(signature)
	if err != nil {
		return false
	}
	return Verify(secret, message, digest)
}

// VerifyBase64URL verifies a base64url-encoded signature (with or without padding).
func VerifyBase64URL(secret, message []byte, signature string) bool {
	digest, err := base64.RawURLEncoding.DecodeString(signature)
	if err != nil {
		digest, err = base64.URLEncoding.DecodeString(signature)
		if err != nil {
			return false
		}
	}
	return Verify(secret, message, digest)
}

// Equal is a constant-time compare of two signatures / tokens of equal length.
func Equal(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
