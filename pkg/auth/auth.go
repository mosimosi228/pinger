package auth

import (
	"fmt"
	"time"
)

type Type string

const (
	TypeAPIKey Type = "api_key"
	TypeJWT    Type = "jwt"
)

const (
	defaultAccessTTL  = time.Hour
	defaultRefreshTTL = 7 * 24 * time.Hour
)

// Config configures JWT and/or API-token auth.
type Config struct {
	Type       Type
	APIKey     string        // shared service API key (api_key mode)
	JWTSecret  string        // HS256 secret (jwt mode)
	AccessTTL  time.Duration // access token TTL; default 1h
	RefreshTTL time.Duration // refresh token TTL; default 7d
}

// Auth is a reusable authenticator (JWT and/or API token).
type Auth struct {
	cfg Config
}

// New creates an Auth instance. Type selects the primary mode;
// JWT helpers still work if JWTSecret is set, API helpers if APIKey is set.
func New(cfg Config) (*Auth, error) {
	if cfg.AccessTTL <= 0 {
		cfg.AccessTTL = defaultAccessTTL
	}
	if cfg.RefreshTTL <= 0 {
		cfg.RefreshTTL = defaultRefreshTTL
	}

	switch cfg.Type {
	case TypeJWT, "":
		if cfg.Type == "" {
			cfg.Type = TypeJWT
		}
		if cfg.JWTSecret == "" {
			return nil, fmt.Errorf("%w: jwt_secret is required", ErrNotConfigured)
		}
	case TypeAPIKey:
		if cfg.APIKey == "" {
			return nil, fmt.Errorf("%w: api_key is required", ErrNotConfigured)
		}
	default:
		return nil, fmt.Errorf("%w: unknown auth type %q", ErrNotConfigured, cfg.Type)
	}

	return &Auth{cfg: cfg}, nil
}

func (a *Auth) Type() Type                { return a.cfg.Type }
func (a *Auth) IsAPIKey() bool            { return a.cfg.Type == TypeAPIKey }
func (a *Auth) IsJWT() bool               { return a.cfg.Type == TypeJWT }
func (a *Auth) AccessTTL() time.Duration  { return a.cfg.AccessTTL }
func (a *Auth) RefreshTTL() time.Duration { return a.cfg.RefreshTTL }
