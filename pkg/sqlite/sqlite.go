package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/mattn/go-sqlite3"
	"github.com/mosimosi228/pinger/migrations"
)

const DefaultDBPath = "./tmp/public.db"

var DB *sql.DB

func New(ctx context.Context, opt Option) error {
	path := opt.Path
	if path == "" {
		path = DefaultDBPath
	}

	if err := ensureDir(path); err != nil {
		return err
	}

	migrateDSN := toMigrateDSN(path)

	if err := runMigrations(migrateDSN, "migrations", migrations.FS); err != nil {
		return err
	}

	db, err := sql.Open("sqlite3", toConnDSN(path))
	if err != nil {
		return err
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return err
	}

	DB = db

	slog.Info("SQLite connected",
		slog.String("path", path),
	)

	return nil
}

func Close() {
	if DB != nil {
		_ = DB.Close()
		slog.Info("SQLite connection closed")
	}
}

func runMigrations(dsn string, table string, files fs.FS) error {
	if !hasMigrationFS(files) {
		slog.Info("migrations skipped: no files in embed FS")
		return nil
	}

	if table != "" {
		sep := "?"
		if strings.Contains(dsn, "?") {
			sep = "&"
		}
		dsn += sep + "x-migrations-table=" + table
	}

	source, err := iofs.New(files, ".")
	if err != nil {
		return err
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, dsn)
	if err != nil {
		return err
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	version, dirty, _ := m.Version()
	if dirty {
		slog.Warn("migrations dirty", slog.Uint64("version", uint64(version)))
	} else {
		slog.Info("migrations applied", slog.Uint64("version", uint64(version)))
	}

	return nil
}

func hasMigrationFS(files fs.FS) bool {
	entries, err := fs.ReadDir(files, ".")
	if err != nil {
		return false
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(name, ".up.sql") || strings.HasSuffix(name, ".down.sql") {
			return true
		}
	}
	return false
}

func hasMigrationFiles(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(name, ".up.sql") || strings.HasSuffix(name, ".down.sql") {
			return true
		}
	}

	return false
}

func ensureDir(path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0o644)
		if err != nil {
			return err
		}
		return f.Close()
	}

	return nil
}

func toMigrateDSN(path string) string {
	return "sqlite3://" + filepath.ToSlash(path)
}

func toConnDSN(path string) string {
	return "file:" + filepath.ToSlash(path) +
		"?_pragma=foreign_keys(1)" +
		"&_pragma=busy_timeout(5000)" +
		"&_pragma=journal_mode(WAL)"
}
