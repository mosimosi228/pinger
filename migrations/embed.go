package migrations

import "embed"

// FS holds SQL migrations embedded in the binary.
//
//go:embed *.sql
var FS embed.FS
