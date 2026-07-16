# pkg/auth

Authorization via JWT (HS256) or a shared API token.

Import: `github.com/mosimosi228/pinger/pkg/auth`

The package lives outside `internal/` — it can be imported from other modules.

## Modes

| Type | Purpose |
|------|---------|
| `auth.TypeJWT` | access + refresh JWT, `sub` = user ID |
| `auth.TypeAPIKey` | single shared service API key |

Create an instance via `New` — no global singleton.

## Config

```go
type Config struct {
    Type       Type          // jwt | api_key
    APIKey     string        // required for api_key
    JWTSecret  string        // required for jwt
    AccessTTL  time.Duration // default 1h
    RefreshTTL time.Duration // default 7d
}
```

## JWT

```go
a, err := auth.New(auth.Config{
    Type:      auth.TypeJWT,
    JWTSecret: secret,
})

access, refresh, err := a.GenerateTokens(userID)
sub, err := a.ParseJWT(access)           // access only
sub, err = a.ParseRefreshToken(refresh)  // refresh only
```

- Signing: HS256.
- Claims include `typ`: `access` / `refresh` — refresh cannot be used as access.
- Empty `JWTSecret` → `ErrNotConfigured`.

## API token

```go
key, _ := auth.GenerateAPIKey() // 32 bytes → hex (64 characters)

a, err := auth.New(auth.Config{
    Type:   auth.TypeAPIKey,
    APIKey: key,
})

err = a.VerifyAPIKey(incoming)           // vs Config.APIKey
ok := auth.EqualAPIKey(provided, stored) // per-user key from DB
hash, err := a.HashAPIKey(plain)         // HMAC-SHA256 hex (via pkg/hmac)
```

## Errors

| Error | When |
|-------|------|
| `ErrNotConfigured` | missing secret/key or unknown Type |
| `ErrInvalidToken` | malformed/foreign JWT or wrong typ |
| `ErrTokenExpired` | TTL expired |
| `ErrInvalidAPIKey` | key mismatch |
| `ErrUnexpectedMethod` | not HS256 |

Also exported: `ErrInvalidCredentials`, `ErrUserExists`, `ErrUserBlocked` — for the service layer.

## HTTP example

```go
// Authorization: Bearer <access>
sub, err := a.ParseJWT(token)

// X-API-Key: <key>
if a.IsAPIKey() {
    err = a.VerifyAPIKey(apiKey)
}
// or per-user:
if auth.EqualAPIKey(headerKey, user.APIKey) { ... }
```

## Passwords

| Function | Description |
|----------|-------------|
| `HashPassword(password)` | bcrypt hash |
| `CheckPassword(hash, password)` | compare; error → `ErrInvalidCredentials` |

## Dependencies

- `github.com/golang-jwt/jwt/v5`
- `github.com/mosimosi228/pinger/pkg/hmac`
- `golang.org/x/crypto/bcrypt`
