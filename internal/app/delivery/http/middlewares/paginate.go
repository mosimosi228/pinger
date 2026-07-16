package middlewares

import (
	"context"
	"github.com/go-chi/render"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/query"
	hp "github.com/mosimosi228/pinger/pkg/http_processor"
	"net/http"
)

func CheckPagination(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var q query.PaginateQuery
		if err := hp.GetSafeQuery(&q)(r); err != nil {
			_ = render.Render(w, r, answer.ErrBadRequest(err))
			return
		}

		// store normalized values in context
		ctx := r.Context()
		ctx = context.WithValue(ctx, PageCtxParam, q.Page)
		ctx = context.WithValue(ctx, LimitCtxParam, q.Limit)
		ctx = context.WithValue(ctx, OffsetCtxParam, (q.Page-1)*q.Limit)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
