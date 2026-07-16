package utils

import (
	"log/slog"
	"net/url"
	"strings"
)

// IsValidURL checks whether a string is a valid HTTP/HTTPS URL.
// Supports:
// - https://example.com/path
// - http://example.com/path
// - //example.com/path (protocol-relative, common in VAST/adtech)
// Rejects: javascript:, data:, ftp:, relative /path, empty strings, unsafe characters.
func IsValidURL(s string) bool {
	if s == "" {
		return false
	}

	trimmed := strings.TrimSpace(s)

	parseStr := trimmed
	if strings.HasPrefix(trimmed, "//") {
		parseStr = "https:" + trimmed
	}

	u, err := url.Parse(parseStr)
	if err != nil {
		return false
	}

	if u.Host == "" {
		return false
	}

	// http/https only
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}

	return true
}

func MaskDSN(dsn string) string {
	u, err := url.Parse(dsn)
	if err != nil {
		slog.Warn("Error parsing Postgres DSN", slog.Any("err", err))
		// Handle the error appropriately, perhaps a different parsing mechanism is needed
		return "..."
	}

	return u.Redacted()
}
