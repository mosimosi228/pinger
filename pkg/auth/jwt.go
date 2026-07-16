package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	tokenTypeAccess  = "access"
	tokenTypeRefresh = "refresh"
)

type claims struct {
	TokenType string `json:"typ"`
	jwt.RegisteredClaims
}

func (a *Auth) jwtKey() ([]byte, error) {
	if a.cfg.JWTSecret == "" {
		return nil, ErrNotConfigured
	}
	return []byte(a.cfg.JWTSecret), nil
}

// GenerateTokens issues access + refresh JWTs with sub = subject (usually user UUID).
func (a *Auth) GenerateTokens(subject string) (accessToken, refreshToken string, err error) {
	if subject == "" {
		return "", "", ErrInvalidToken
	}
	key, err := a.jwtKey()
	if err != nil {
		return "", "", err
	}

	now := time.Now()

	access := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		TokenType: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			ExpiresAt: jwt.NewNumericDate(now.Add(a.cfg.AccessTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	})
	refresh := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		TokenType: tokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			ExpiresAt: jwt.NewNumericDate(now.Add(a.cfg.RefreshTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	})

	accessToken, err = access.SignedString(key)
	if err != nil {
		return "", "", fmt.Errorf("auth: sign access: %w", err)
	}
	refreshToken, err = refresh.SignedString(key)
	if err != nil {
		return "", "", fmt.Errorf("auth: sign refresh: %w", err)
	}
	return accessToken, refreshToken, nil
}

// ParseJWT validates an access token and returns the subject.
func (a *Auth) ParseJWT(tokenString string) (string, error) {
	return a.parseToken(tokenString, tokenTypeAccess)
}

// ParseRefreshToken validates a refresh token and returns the subject.
func (a *Auth) ParseRefreshToken(tokenString string) (string, error) {
	return a.parseToken(tokenString, tokenTypeRefresh)
}

func (a *Auth) parseToken(tokenString, wantType string) (string, error) {
	if tokenString == "" {
		return "", ErrInvalidToken
	}

	key, err := a.jwtKey()
	if err != nil {
		return "", err
	}

	parsed := &claims{}
	token, err := jwt.ParseWithClaims(tokenString, parsed, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, ErrUnexpectedMethod
		}
		return key, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return "", ErrTokenExpired
		}
		return "", ErrInvalidToken
	}
	if !token.Valid {
		return "", ErrInvalidToken
	}
	if parsed.TokenType != wantType {
		return "", ErrInvalidToken
	}
	if parsed.Subject == "" {
		return "", ErrInvalidToken
	}
	return parsed.Subject, nil
}
