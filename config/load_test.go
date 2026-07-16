package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadUsesDefaultsWithoutFile(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)

	cfg, err := Load("")
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	defaults := defaultConfig()
	if cfg.App.Name != defaults.App.Name {
		t.Fatalf("App.Name = %q, want %q", cfg.App.Name, defaults.App.Name)
	}
	if cfg.SQLite.Path != defaults.SQLite.Path {
		t.Fatalf("SQLite.Path = %q, want %q", cfg.SQLite.Path, defaults.SQLite.Path)
	}
}

func TestLoadOverridesDefaultsFromYAML(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)

	path := filepath.Join(dir, "pinger.yaml")
	content := []byte(`
app:
  name: From YAML
  port: "9090"
sqlite:
  path: /data/pinger.db
`)
	if err := os.WriteFile(path, content, 0o644); err != nil {
		t.Fatal(err)
	}

	cfg, err := Load("")
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.App.Name != "From YAML" {
		t.Fatalf("App.Name = %q, want From YAML", cfg.App.Name)
	}
	if cfg.App.Port != "9090" {
		t.Fatalf("App.Port = %q, want 9090", cfg.App.Port)
	}
	if cfg.SQLite.Path != "/data/pinger.db" {
		t.Fatalf("SQLite.Path = %q, want /data/pinger.db", cfg.SQLite.Path)
	}
	if cfg.App.Env != defaultConfig().App.Env {
		t.Fatalf("App.Env = %q, want default %q", cfg.App.Env, defaultConfig().App.Env)
	}
}

func TestLoadWithExplicitPath(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "custom.yaml")
	content := []byte(`
app:
  name: Custom
`)
	if err := os.WriteFile(path, content, 0o644); err != nil {
		t.Fatal(err)
	}

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.App.Name != "Custom" {
		t.Fatalf("App.Name = %q, want Custom", cfg.App.Name)
	}
}

func TestLoadFailsWhenExplicitConfigMissing(t *testing.T) {
	if _, err := Load(filepath.Join(t.TempDir(), "missing.yaml")); err == nil {
		t.Fatal("Load() error = nil, want missing config error")
	}
}

func TestMustLoadSetsEnvironments(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "pinger.yaml")
	if err := os.WriteFile(path, []byte("app:\n  name: Loaded\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := MustLoad(path); err != nil {
		t.Fatalf("MustLoad() error = %v", err)
	}
	if Environments == nil || Environments.App.Name != "Loaded" {
		t.Fatalf("Environments = %+v, want name Loaded", Environments)
	}
}
