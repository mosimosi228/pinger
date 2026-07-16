package config

import "testing"

func TestIsDevelopment(t *testing.T) {
	tests := []struct {
		env  string
		want bool
	}{
		{env: "dev", want: true},
		{env: "development", want: true},
		{env: "test", want: true},
		{env: "prod", want: false},
		{env: "production", want: false},
	}

	for _, tt := range tests {
		cfg := Config{}
		cfg.App.Env = tt.env
		if got := cfg.IsDevelopment(); got != tt.want {
			t.Fatalf("IsDevelopment(%q) = %v, want %v", tt.env, got, tt.want)
		}
	}
}

func TestIsProduction(t *testing.T) {
	tests := []struct {
		env  string
		want bool
	}{
		{env: "prod", want: true},
		{env: "production", want: true},
		{env: "dev", want: false},
		{env: "test", want: false},
	}

	for _, tt := range tests {
		cfg := Config{}
		cfg.App.Env = tt.env
		if got := cfg.IsProduction(); got != tt.want {
			t.Fatalf("IsProduction(%q) = %v, want %v", tt.env, got, tt.want)
		}
	}
}

func TestDBPath(t *testing.T) {
	cfg := Config{}
	cfg.SQLite.Path = "/etc/pinger/pinger.db"

	if got := cfg.DBPath(); got != "/etc/pinger/pinger.db" {
		t.Fatalf("DBPath() = %q, want /etc/pinger/pinger.db", got)
	}
}
