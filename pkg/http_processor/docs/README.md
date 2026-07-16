# pkg/http_processor

HTTP query / path / JSON body binding and validation.

Import: `github.com/mosimosi228/pinger/pkg/http_processor`

## Purpose

Parse parameters in a handler with one call and get a typed struct plus validation errors.

## GetSafeQuery

Binds query + chi URL params + `default`, then validates.

Tags:

| Tag | Source |
|-----|--------|
| `query:"name"` | `?name=` |
| `param:"name"` | chi `{name}` |
| `default:"value"` | when the param is missing |
| `validate:"..."` | go-playground/validator |

```go
type Req struct {
    Page   int    `query:"page" default:"1" validate:"min=1"`
    UserID string `param:"user_id" validate:"required"`
}

var q Req
if err := http_processor.GetSafeQuery(&q)(r); err != nil {
    // ValidationError or bind error
}
```

`dst` must be `*struct`, otherwise panic.

## GetSafeJsonBody

JSON decode + validate.

```go
var body CreateReq
if err := http_processor.GetSafeJsonBody(&body)(r); err != nil {
    ...
}
```

## ValidateStruct

Direct validator call. On failure returns `*ValidationError` with `Details map[string]string`.

```go
if err := http_processor.ValidateStruct(&req); err != nil {
    var ve *http_processor.ValidationError
    if errors.As(err, &ve) {
        // ve.Details
    }
}
```

## Dependencies

- `github.com/go-chi/chi/v5` (URL params)
- `github.com/go-playground/validator/v10`
