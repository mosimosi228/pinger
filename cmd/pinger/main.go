package main

import (
	"github.com/mosimosi228/pinger/internal/app/cli"
	"os"
)

func main() {
	if err := cli.Execute(); err != nil {
		os.Exit(1)
	}
}
