package http

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v3"
	"github.com/go-chi/render"
	config "github.com/mosimosi228/pinger/config"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/answer"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/handler"
	"github.com/mosimosi228/pinger/internal/app/delivery/http/middlewares"
	"github.com/mosimosi228/pinger/internal/webui"
	l "github.com/mosimosi228/pinger/pkg/logger"
)

func NewRouter() http.Handler {
	var log = l.StartLogs(&l.Options{Level: config.Environments.Logs.Level}, []l.LoggerHandler{l.ConsoleType})

	r := chi.NewRouter()
	r.Use(httplog.RequestLogger(log, &httplog.Options{
		Level:         slog.LevelDebug,
		Schema:        httplog.SchemaOTEL,
		RecoverPanics: true,
	}))

	r.Use(middleware.RealIP)
	r.Use(middleware.CleanPath)
	r.Use(middlewares.PublicCORS)
	r.NotFound(handler.Error.NotFound)
	r.MethodNotAllowed(handler.Error.NotFound)

	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) { _ = render.Render(w, r, answer.Ping) })

	r.Post("/auth/register", handler.Auth.Register)
	r.With(middlewares.LoginRateLimit).Post("/auth/login", handler.Auth.Login)
	r.Post("/auth/refresh", handler.Auth.Refresh)

	r.Get("/api/public/s/{slug}", handler.StatusPage.PublicGet)
	r.Get("/api/public/ws/s/{slug}", handler.Live.PublicSlug)
	r.Get("/api/v1/ws", handler.Live.User)

	r.Mount("/api", routerApi())

	r.Get("/*", spaHandler())

	return r
}

func routerApi() *chi.Mux {
	r := chi.NewRouter()
	r.Use(render.SetContentType(render.ContentTypeJSON))
	r.Use(middleware.RealIP)
	r.Use(middleware.CleanPath)
	r.Use(middlewares.PublicCORS)
	r.Use(middlewares.RequireAuth)

	r.Route("/v1", func(r chi.Router) {
		r.Get("/me", handler.Auth.Me)
		r.Patch("/me", handler.Auth.UpdateMe)

		r.Get("/monitors", handler.Monitor.List)
		r.Post("/monitors", handler.Monitor.Create)
		r.Get("/monitors/{id}", handler.Monitor.Get)
		r.Patch("/monitors/{id}", handler.Monitor.Update)
		r.Delete("/monitors/{id}", handler.Monitor.Delete)
		r.Get("/monitors/{id}/checks", handler.Check.ListByMonitor)
		r.Post("/monitors/{id}/notifications", handler.Monitor.AttachNotification)
		r.Delete("/monitors/{id}/notifications/{notificationID}", handler.Monitor.DetachNotification)

		r.Get("/notifications", handler.Notification.List)
		r.Post("/notifications", handler.Notification.Create)
		r.Get("/notifications/{id}", handler.Notification.Get)
		r.Patch("/notifications/{id}", handler.Notification.Update)
		r.Delete("/notifications/{id}", handler.Notification.Delete)

		r.Get("/status-pages", handler.StatusPage.List)
		r.Post("/status-pages", handler.StatusPage.Create)
		r.Get("/status-pages/{id}", handler.StatusPage.Get)
		r.Patch("/status-pages/{id}", handler.StatusPage.Update)
		r.Delete("/status-pages/{id}", handler.StatusPage.Delete)
		r.Post("/status-pages/{id}/monitors", handler.StatusPage.AttachMonitor)
		r.Delete("/status-pages/{id}/monitors/{monitorID}", handler.StatusPage.DetachMonitor)
	})

	return r
}

func spaHandler() http.HandlerFunc {
	fileServer := http.FileServer(http.FS(webui.FS))

	return func(w http.ResponseWriter, req *http.Request) {
		path := strings.TrimPrefix(req.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if f, err := webui.FS.Open(path); err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(w, req)
			return
		}

		// SPA fallback
		http.ServeFileFS(w, req, webui.FS, "index.html")
	}
}
