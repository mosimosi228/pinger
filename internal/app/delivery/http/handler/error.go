package handler

import (
	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"net/http"
)

type ErrorController struct{}

func (h *ErrorController) NotFound(w http.ResponseWriter, r *http.Request) {
	err := render.Render(w, r, answer.ErrNotFound)
	if err != nil {
		return
	}
}
