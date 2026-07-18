package serve

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	pkgauth "github.com/mosimosi228/kit/auth"
	"github.com/mosimosi228/kit/logger"
	"github.com/mosimosi228/kit/sqlite"
	"github.com/mosimosi228/pinger/config"
	router "github.com/mosimosi228/pinger/internal/app/delivery/http"
	"github.com/mosimosi228/pinger/internal/app/service/scheduler"
	"github.com/mosimosi228/pinger/internal/app/service/worker"
	infracache "github.com/mosimosi228/pinger/internal/infra/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/migrations"
)

func Execute(ctx context.Context) error {
	slog.SetDefault(logger.StartLogs(&logger.Options{
		Level:          config.Environments.Logs.Level,
		OutputDir:      config.Environments.Logs.OutDir,
		OutputFileName: config.Environments.Logs.OutFilename,
	}, []logger.LoggerHandler{logger.ConsoleType, logger.FileType}))

	if err := sqlite.New(ctx, sqlite.Option{Path: config.Environments.DBPath(), MigrationsFS: migrations.FS}); err != nil {
		return err
	}
	defer sqlite.Close()

	slog.Info("Database connected")

	infracache.Init()

	var jwt *string
	var api *string

	if config.Environments.Security.JWTSecret != "" {
		jwt = &config.Environments.Security.JWTSecret
	}

	if config.Environments.Security.APIKey != "" {
		api = &config.Environments.Security.APIKey
	}

	if err := pkgauth.CreateAuthManager(jwt, api); err != nil {
		return err
	}

	slog.Info("Auth manager created")

	workers := config.Environments.App.Workers
	if workers < 1 {
		workers = 1
	}

	jobs := make(chan *mapping.Monitor, 256)
	for i := 0; i < workers; i++ {
		go worker.RunPingWorker(ctx, jobs)
	}
	go scheduler.StartScheduler(ctx, jobs)
	go scheduler.StartCheckRetention(ctx)
	slog.Info("Ping pipeline started", slog.Int("workers", workers))

	handler := router.NewRouter()
	slog.Info("Router created")

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%s", config.Environments.App.Port),
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       0,
		WriteTimeout:      0,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		slog.Info("Pinger service started", slog.String("addr", config.Environments.App.Addr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
		}
	}()

	<-ctx.Done()

	slog.Info("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced shutdown", "err", err)
		return err
	}

	slog.Info("server stopped gracefully")

	return nil
}
