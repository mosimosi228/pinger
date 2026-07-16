package answer

import (
	"github.com/go-chi/render"
	"net/http"
)

type ResponseAnswer struct {
	HTTPStatusCode int    `json:"-"`              // http response status code
	StatusText     string `json:"status"`         // user-level status message
	AppCode        int64  `json:"code,omitempty"` // application-specific error code
}

func (e *ResponseAnswer) Render(w http.ResponseWriter, r *http.Request) error {
	render.Status(r, e.HTTPStatusCode)
	return nil
}

var OK = &ResponseAnswer{HTTPStatusCode: http.StatusOK, StatusText: "ok!"}
var Created = &ResponseAnswer{HTTPStatusCode: http.StatusCreated, StatusText: "created!"}
var Deleted = &ResponseAnswer{HTTPStatusCode: http.StatusAccepted, StatusText: "deleted!"}
var Ping = &ResponseAnswer{HTTPStatusCode: http.StatusOK, StatusText: "PONG"}
