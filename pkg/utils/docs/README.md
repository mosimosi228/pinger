# pkg/utils

Small helpers without domain logic.

Import: `github.com/mosimosi228/pinger/pkg/utils`

## Config / JSON

| Function | Description |
|----------|-------------|
| `LoadYAML[T](path, dest)` | read YAML into `dest` |
| `PrettyJSON(v)` | indent JSON |
| `MinifyJSON(s)` | compact JSON (or original string) |
| `FixBrokenJSON(s)` | heuristic fix for quotes/escapes |

## Strings / slices

| Function | Description |
|----------|-------------|
| `Map(s, f)` | apply `f` to each element |
| `Deref(p)` | `*p` or zero |
| `TrimAndJoinCompact(s, sep)` | trim + drop empty parts |
| `ReturnValOrNil` | return value or nil |

## URL / DSN

| Function | Description |
|----------|-------------|
| `IsValidURL(s)` | http/https (including `//host/path`) |
| `MaskDSN(dsn)` | redact password in URL |

## Secrets / UUID

| Function | Description |
|----------|-------------|
| `GenerateJWTSecret()` | 32 random bytes → hex (for HS256) |
| `ParsePgUUIDParam(key, r)` | query → `pgtype.UUID` |
| `ParsePgBool` / similar pgtype helpers | parse into pgx types |

## Example

```go
cfg := &Config{}
if err := utils.LoadYAML("pinger.yaml", cfg); err != nil {
    return err
}

secret, err := utils.GenerateJWTSecret()
if !utils.IsValidURL(raw) {
    return errors.New("bad url")
}
slog.Info("db", "dsn", utils.MaskDSN(dsn))
```
