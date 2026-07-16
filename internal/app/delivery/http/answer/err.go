package answer

import (
	"github.com/go-chi/render"
	"log/slog"
	"net/http"
)

type ErrResponse struct {
	Err            error `json:"-"` // low-level runtime error
	HTTPStatusCode int   `json:"-"` // http response status code

	StatusText string `json:"status"`          // user-level status message
	AppCode    int64  `json:"code,omitempty"`  // application-specific error code
	ErrorText  string `json:"error,omitempty"` // application-level error message, for debugging
}

func (e *ErrResponse) Render(w http.ResponseWriter, r *http.Request) error {
	switch e.HTTPStatusCode {
	case http.StatusUnauthorized:
		slog.Info("Unauthorized", slog.Any("error", e.Err), slog.Any("status", e.StatusText))
	case http.StatusInternalServerError:
		slog.Error("Internal server error", slog.Any("error", e.Err), slog.Any("status", e.StatusText))
	case http.StatusForbidden:
		slog.Info("Forbidden")
	case http.StatusBadRequest:
		slog.Warn("Bad request", slog.Any("error", e.Err), slog.Any("status", e.StatusText))
	case http.StatusTooManyRequests:
		slog.Warn("Top Many Requests", slog.Any("error", e.Err), slog.Any("status", e.StatusText))
	default:
		slog.Debug("Unknown error", slog.Any("error", e.Err), slog.Any("status", e.StatusText))
	}

	render.Status(r, e.HTTPStatusCode)
	return nil
}

func ErrBadRequest(err error) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: http.StatusBadRequest,
		StatusText:     "Bad Request",
		ErrorText:      err.Error(),
	}
}

func ErrRender(err error) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: http.StatusUnprocessableEntity,
		StatusText:     "Error rendering response",
		ErrorText:      err.Error(),
	}
}

func ErrInternalError(err error) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: http.StatusInternalServerError,
		StatusText:     "Internal server error!",
		ErrorText:      err.Error(),
	}
}

var NotFoundRowsInResult = &ErrResponse{HTTPStatusCode: http.StatusNotFound, StatusText: "Not found rows in result!"}
var ErrNotFound = &ErrResponse{HTTPStatusCode: http.StatusNotFound, StatusText: "Resource not found!"}
var ErrUnauthorized = &ErrResponse{HTTPStatusCode: http.StatusUnauthorized, StatusText: "Unauthorized!"}
var ErrForbidden = &ErrResponse{HTTPStatusCode: http.StatusForbidden, StatusText: "Forbidden!"}
var ErrRateLimit = &ErrResponse{HTTPStatusCode: http.StatusTooManyRequests, StatusText: "To many requests!"}
