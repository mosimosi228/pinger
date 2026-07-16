package sqlite

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestHasMigrationFiles(t *testing.T) {
	dir := t.TempDir()

	if hasMigrationFiles(dir) {
		t.Fatal("expected empty dir to have no migrations")
	}

	if err := os.WriteFile(filepath.Join(dir, "001_init.up.sql"), []byte("-- init"), 0o644); err != nil {
		t.Fatal(err)
	}
	if !hasMigrationFiles(dir) {
		t.Fatal("expected migration file to be detected")
	}
}

func TestEnsureDirCreatesDatabaseFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nested", "pinger.db")

	if err := ensureDir(path); err != nil {
		t.Fatalf("ensureDir() error = %v", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("Stat() error = %v", err)
	}
	if info.IsDir() {
		t.Fatal("expected database path to be a file")
	}
}

func TestDSNHelpers(t *testing.T) {
	path := "/tmp/pinger.db"

	if got := toMigrateDSN(path); got != "sqlite3:///tmp/pinger.db" {
		t.Fatalf("toMigrateDSN() = %q", got)
	}

	conn := toConnDSN(path)
	if conn != "file:/tmp/pinger.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)" {
		t.Fatalf("toConnDSN() = %q", conn)
	}
}

func TestNewAndClose(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pinger.db")

	if err := New(context.Background(), Option{Path: path}); err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if DB == nil {
		t.Fatal("DB is nil after New()")
	}

	var n int
	if err := DB.QueryRowContext(context.Background(), "SELECT 1").Scan(&n); err != nil {
		t.Fatalf("QueryRow() error = %v", err)
	}
	if n != 1 {
		t.Fatalf("SELECT 1 = %d, want 1", n)
	}

	Close()
}

func TestNewUsesDefaultPathWhenEmpty(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)

	if err := New(context.Background(), Option{}); err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer Close()

	if _, err := os.Stat(DefaultDBPath); err != nil {
		t.Fatalf("Stat(%q) error = %v", DefaultDBPath, err)
	}
}
