# pkg/hmac

HMAC-SHA256: sign and verify messages.

Import: `github.com/mosimosi228/pinger/pkg/hmac`

## Purpose

Sign payloads (requests, webhook bodies, API tokens) with a shared secret and verify signatures in constant time.

## API

| Function | Description |
|----------|-------------|
| `Sign(secret, message)` | raw digest (32 bytes) |
| `SignHex` / `VerifyHex` | hex |
| `SignBase64` / `VerifyBase64` | standard base64 |
| `SignBase64URL` / `VerifyBase64URL` | base64url (no padding; verify accepts padded input too) |
| `Equal(a, b)` | constant-time comparison of equal-length strings |

`Verify*` returns `bool`. Invalid encoding → `false`.

## Example

```go
import "github.com/mosimosi228/pinger/pkg/hmac"

secret := []byte("shared-secret")
msg := []byte("POST/v1/ping{}")

sig := hmac.SignHex(secret, msg)
if !hmac.VerifyHex(secret, msg, sig) {
    // signature mismatch
}
```

## Notes

- Algorithm is SHA-256 only.
- Secret should be long and random (e.g. 32 bytes).
- For comparing API tokens, prefer `Equal` over `==`.
