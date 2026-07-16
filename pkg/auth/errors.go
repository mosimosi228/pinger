package auth

import "errors"

var (
	ErrNotConfigured      = errors.New("auth: not configured")
	ErrInvalidToken       = errors.New("auth: invalid token")
	ErrInvalidAPIKey      = errors.New("auth: invalid api key")
	ErrTokenExpired       = errors.New("auth: token expired")
	ErrUnexpectedMethod   = errors.New("auth: unexpected signing method")
	ErrInvalidCredentials = errors.New("auth: invalid credentials")
	ErrUserExists         = errors.New("auth: user already exists")
	ErrUserBlocked        = errors.New("auth: user is blocked")
)
