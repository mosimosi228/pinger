package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gopkg.in/yaml.v3"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func LoadYAML[T interface{}](path string, dest T) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	return yaml.Unmarshal(data, dest)
}

func Map[S ~[]E, E any](s S, f func(*E)) {
	for i := range s {
		f(&s[i])
	}
}

func Deref[T any](p *T) T {
	if p == nil {
		var zero T
		return zero
	}
	return *p
}

func TrimAndJoinCompact(s, sep string) string {
	var cleaned []string
	for _, p := range strings.Split(s, sep) {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	return strings.Join(cleaned, sep)
}

func ReturnValOrNil(val *any) any {
	if *val != nil {
		return *val
	}

	return nil
}

func PrettyJSON(v any) string {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprintf("JSON marshal error: %v", err)
	}
	return string(b)
}
func FixBrokenJSON(s string) string {
	// Remove extra quotes around numbers and string values
	s = regexp.MustCompile(`"(\d+(?:\.\d+)?)"`).ReplaceAllString(s, `$1`)
	s = regexp.MustCompile(`"([A-Z0-9_]+)":\s*"([^"]+)"`).ReplaceAllString(s, `"$1": "$2"`)
	s = regexp.MustCompile(`\\(.)`).ReplaceAllString(s, `$1`)
	return s
}

func ParsePgUUIDParam(key string, r *http.Request) pgtype.UUID {
	idStr := r.URL.Query().Get(key)
	if idStr == "" {
		return pgtype.UUID{Valid: false} // NULL in DB
	}

	parsed, err := uuid.Parse(idStr)
	if err != nil {
		return pgtype.UUID{Valid: false} // invalid UUID — also NULL
	}

	return pgtype.UUID{Bytes: parsed, Valid: true}
}
func ParsePgStringParam(key string, r *http.Request) pgtype.Text {
	str := r.URL.Query().Get(key)
	if str == "" {
		return pgtype.Text{Valid: false} // NULL in DB
	}

	return pgtype.Text{String: str, Valid: true}
}

func ParsePgBoolParam(key string, r *http.Request) pgtype.Bool {
	str := r.URL.Query().Get(key)
	if str == "" || (str != "true" && str != "false") {
		return pgtype.Bool{Valid: false} // NULL in DB
	}

	return pgtype.Bool{Bool: str == "true", Valid: true}
}

func MinifyJSON(s string) string {
	if s == "" {
		return ""
	}
	var v interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return s // not JSON — return as-is
	}
	b, _ := json.Marshal(v)
	return string(b)
}

func GenerateJWTSecret() (string, error) {
	// 32 bytes equals 256 bits, perfect for the HMAC-SHA256 (HS256) algorithm
	bytes := make([]byte, 32)

	// Read cryptographically secure pseudorandom numbers into the slice
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	// Convert the raw bytes into a readable hex string
	return hex.EncodeToString(bytes), nil
}
