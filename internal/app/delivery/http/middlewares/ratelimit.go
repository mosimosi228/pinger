package middlewares

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// LoginRateLimit allows 5 login attempts per minute per IP.
func LoginRateLimit(next http.Handler) http.Handler {
	return httprate.LimitByIP(5, time.Minute)(next)
}
