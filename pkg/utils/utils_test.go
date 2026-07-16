package utils

import (
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func TestMap(t *testing.T) {
	items := []int{1, 2, 3}
	Map(items, func(v *int) {
		*v *= 2
	})

	want := []int{2, 4, 6}
	for i, got := range items {
		if got != want[i] {
			t.Fatalf("items[%d] = %d, want %d", i, got, want[i])
		}
	}
}

func TestDeref(t *testing.T) {
	v := 42
	if got := Deref(&v); got != 42 {
		t.Fatalf("Deref(&v) = %d, want 42", got)
	}
	if got := Deref[int](nil); got != 0 {
		t.Fatalf("Deref(nil) = %d, want 0", got)
	}
}

func TestTrimAndJoinCompact(t *testing.T) {
	got := TrimAndJoinCompact(" a , , b , c ", ",")
	if got != "a,b,c" {
		t.Fatalf("TrimAndJoinCompact() = %q, want %q", got, "a,b,c")
	}
}

func TestReturnValOrNil(t *testing.T) {
	val := any("hello")
	if got := ReturnValOrNil(&val); got != "hello" {
		t.Fatalf("ReturnValOrNil(non-nil) = %v, want hello", got)
	}

	var nilVal any
	if got := ReturnValOrNil(&nilVal); got != nil {
		t.Fatalf("ReturnValOrNil(nil) = %v, want nil", got)
	}
}

func TestPrettyJSON(t *testing.T) {
	got := PrettyJSON(map[string]int{"a": 1})
	want := "{\n  \"a\": 1\n}"
	if got != want {
		t.Fatalf("PrettyJSON() = %q, want %q", got, want)
	}
}

func TestFixBrokenJSON(t *testing.T) {
	input := `{"COUNT":"10","NAME":"test"}`
	got := FixBrokenJSON(input)
	if !strings.Contains(got, `"COUNT":10`) {
		t.Fatalf("FixBrokenJSON() = %q, expected unquoted numeric COUNT", got)
	}
	if !strings.Contains(got, `"NAME": "test"`) {
		t.Fatalf("FixBrokenJSON() = %q, expected normalized NAME", got)
	}
}

func TestMinifyJSON(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{name: "empty", input: "", want: ""},
		{name: "valid json", input: "{\n  \"a\": 1\n}", want: `{"a":1}`},
		{name: "plain text", input: "not-json", want: "not-json"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MinifyJSON(tt.input); got != tt.want {
				t.Fatalf("MinifyJSON() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestParsePgUUIDParam(t *testing.T) {
	validID := uuid.NewString()
	req := &http.Request{URL: mustParseURL("http://example.com?id=" + validID)}

	got := ParsePgUUIDParam("id", req)
	if !got.Valid {
		t.Fatal("expected valid UUID")
	}

	req = &http.Request{URL: mustParseURL("http://example.com?id=bad")}
	got = ParsePgUUIDParam("id", req)
	if got.Valid {
		t.Fatal("expected invalid UUID for bad input")
	}

	req = &http.Request{URL: mustParseURL("http://example.com")}
	got = ParsePgUUIDParam("id", req)
	if got.Valid {
		t.Fatal("expected invalid UUID for missing param")
	}
}

func TestParsePgStringParam(t *testing.T) {
	req := &http.Request{URL: mustParseURL("http://example.com?name=alice")}
	got := ParsePgStringParam("name", req)
	if !got.Valid || got.String != "alice" {
		t.Fatalf("ParsePgStringParam() = %+v, want alice", got)
	}

	req = &http.Request{URL: mustParseURL("http://example.com")}
	got = ParsePgStringParam("name", req)
	if got.Valid {
		t.Fatal("expected invalid text for missing param")
	}
}

func TestParsePgBoolParam(t *testing.T) {
	tests := []struct {
		name  string
		query string
		want  pgtype.Bool
	}{
		{
			name:  "true",
			query: "flag=true",
			want:  pgtype.Bool{Bool: true, Valid: true},
		},
		{
			name:  "false",
			query: "flag=false",
			want:  pgtype.Bool{Bool: false, Valid: true},
		},
		{
			name:  "invalid",
			query: "flag=maybe",
			want:  pgtype.Bool{Valid: false},
		},
		{
			name:  "missing",
			query: "",
			want:  pgtype.Bool{Valid: false},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &http.Request{URL: mustParseURL("http://example.com?" + tt.query)}
			got := ParsePgBoolParam("flag", req)
			if got.Valid != tt.want.Valid || got.Bool != tt.want.Bool {
				t.Fatalf("ParsePgBoolParam() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func mustParseURL(raw string) *url.URL {
	u, err := url.Parse(raw)
	if err != nil {
		panic(err)
	}
	return u
}
