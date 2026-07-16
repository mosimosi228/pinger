package webui

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var dist embed.FS

// FS is the SPA root filesystem (dist/ contents).
var FS fs.FS

func init() {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		panic("webui: " + err.Error())
	}
	FS = sub
}
