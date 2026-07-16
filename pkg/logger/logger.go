package logger

import (
	"errors"
	"github.com/lmittmann/tint"
	"os"
	"path/filepath"
	"strings"
	"time"

	slogmulti "github.com/samber/slog-multi"
	"gopkg.in/natefinch/lumberjack.v2"
	"log/slog"
)

// telegramCfg is set via SetTelegramConfig before StartLogs is called.
var telegramCfg TelegramConfig

// SetTelegramConfig enables the Telegram handler (call before StartLogs).
func SetTelegramConfig(cfg TelegramConfig) {
	telegramCfg = cfg
}

type Options struct {
	Level          string
	OutputDir      string
	OutputFileName string
}

func StartLogs(opt *Options, handlers []LoggerHandler) *slog.Logger {
	if opt == nil {
		opt = &Options{
			Level:          "info",
			OutputDir:      "logs",
			OutputFileName: "app.log",
		}
	}
	loggers := getLoggers(opt, handlers)

	return slog.New(slogmulti.Fanout(loggers...))
}

func getLoggers(opt *Options, handlers []LoggerHandler) []slog.Handler {
	var loggers []slog.Handler

	if opt.OutputDir == "" {
		opt.OutputDir = "logs"
	}

	if opt.OutputFileName == "" {
		opt.OutputDir = "app.log"
	}

	for _, handler := range handlers {
		if handler == ConsoleType {
			consoleHandler := tint.NewHandler(os.Stdout, &tint.Options{
				Level:      getLogLevel(opt.Level),
				TimeFormat: time.DateTime,
				AddSource:  true,
				NoColor:    false,
				ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
					if a.Value.Kind() == slog.KindAny {
						if _, ok := a.Value.Any().(error); ok {
							return tint.Attr(9, a)
						}
					}
					return levelReplaceAttr(groups, a)
				},
			})

			loggers = append(loggers, consoleHandler)
		}

		if handler == TelegramType {
			if telegramCfg.Token != "" && telegramCfg.ChatID != "" {
				loggers = append(loggers, newTelegramHandler(telegramCfg))
			}
		}

		if handler == FileType {
			fileWriter := &lumberjack.Logger{
				Filename:   filepath.Join(opt.OutputDir, opt.OutputFileName),
				MaxSize:    100,
				MaxBackups: 1,
				MaxAge:     1,
				Compress:   true,
			}

			fileHandler := slog.NewJSONHandler(fileWriter, &slog.HandlerOptions{
				Level: getLogLevel(opt.Level),
			})

			loggers = append(loggers, fileHandler)
		}

		if handler == PrettyType {
			prettyHandler := NewPrettyHandler(os.Stdout, PrettyHandlerOptions{
				SlogOpts: slog.HandlerOptions{
					AddSource:   true,
					Level:       slog.LevelInfo,
					ReplaceAttr: nil,
				},
			})

			loggers = append(loggers, prettyHandler)
		}
	}

	if len(loggers) == 0 {
		panic(errors.New("no loggers found"))
	}

	return loggers
}

func getLogLevel(lvl string) slog.Leveler {
	switch strings.ToLower(lvl) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
