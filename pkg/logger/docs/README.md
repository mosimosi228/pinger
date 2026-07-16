# pkg/logger

Multi-handler `slog`: console, file, Telegram.

Import: `github.com/mosimosi228/pinger/pkg/logger`

## Purpose

Unified application logging setup with fan-out to multiple sinks.

## Handlers

| Constant | Output |
|----------|--------|
| `ConsoleType` | stdout (tint, color, source) |
| `FileType` | lumberjack (rotation) |
| `TelegramType` | Telegram bot (requires `SetTelegramConfig`) |
| `PrettyType` | pretty handler |

## Example

```go
logger.SetTelegramConfig(logger.TelegramConfig{
    Token:  token,
    ChatID: chatID,
})

log := logger.StartLogs(&logger.Options{
    Level:          "debug",
    OutputDir:      "runtime/logs",
    OutputFileName: "pinger.log",
}, []logger.LoggerHandler{
    logger.ConsoleType,
    logger.FileType,
    logger.TelegramType,
})

slog.SetDefault(log)
```

## Options

```go
type Options struct {
    Level          string // debug, info, warn, error
    OutputDir      string
    OutputFileName string
}
```

## Notes

- Call `SetTelegramConfig` **before** `StartLogs`.
- Telegram handler is not added if token/chat_id are empty.
- File rotation uses `lumberjack`.
