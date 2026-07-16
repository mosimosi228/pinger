package middlewares

import "context"

type ctxKey string

const (
	PageCtxParam   ctxKey = "page"
	LimitCtxParam  ctxKey = "limit"
	OffsetCtxParam ctxKey = "offset"
)

func PageFromContext(ctx context.Context) int {
	if v, ok := ctx.Value(PageCtxParam).(int); ok {
		return v
	}
	return 1
}

func LimitFromContext(ctx context.Context) int {
	if v, ok := ctx.Value(LimitCtxParam).(int); ok {
		return v
	}
	return 100
}

func OffsetFromContext(ctx context.Context) int {
	if v, ok := ctx.Value(OffsetCtxParam).(int); ok {
		return v
	}
	return 0
}
