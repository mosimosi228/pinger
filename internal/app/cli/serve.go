package cli

import (
	"github.com/mosimosi228/pinger/config"
	"github.com/mosimosi228/pinger/internal/infra/usecase/serve"
	"github.com/spf13/cobra"
)

var configPath string

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start HTTP server",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := config.MustLoad(configPath); err != nil {
			return err
		}

		return serve.Execute(cmd.Context())
	},
}

func init() {
	serveCmd.Flags().StringVar(&configPath, "config", "", "path to pinger.yaml")
	serveCmd.Flags().String("port", "", "HTTP port (overrides config)")
}
