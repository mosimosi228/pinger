package utils

import "testing"

func TestIsValidURL(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{name: "empty", input: "", want: false},
		{name: "https", input: "https://example.com/path", want: true},
		{name: "http", input: "http://example.com", want: true},
		{name: "protocol relative", input: "//cdn.example.com/ad.js", want: true},
		{name: "relative path", input: "/path/to/page", want: false},
		{name: "javascript", input: "javascript:alert(1)", want: false},
		{name: "ftp", input: "ftp://example.com", want: false},
		{name: "whitespace around valid", input: "  https://example.com  ", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidURL(tt.input); got != tt.want {
				t.Fatalf("IsValidURL(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestMaskDSN(t *testing.T) {
	got := MaskDSN("postgres://user:secret@localhost:5432/db?sslmode=disable")
	if got == "postgres://user:secret@localhost:5432/db?sslmode=disable" {
		t.Fatal("MaskDSN() should redact password")
	}
	if got == "..." {
		t.Fatal("MaskDSN() should parse valid postgres DSN")
	}
}
