package cli

import (
	"github.com/mosimosi228/pinger/internal/infra/usecase/install"
	"github.com/spf13/cobra"
)

var (
	installForce   bool
	installNoStart bool
)

var installCmd = &cobra.Command{
	Use:   "install",
	Short: "Install pinger as systemd service",
	Long: `Install Pinger for production use (requires root).

Creates:
  /etc/pinger/pinger.yaml
  /var/lib/pinger/
  /var/log/pinger/
  /usr/local/bin/pinger
  /etc/systemd/system/pinger.service

Then enables and starts pinger.service.

Typical flow:
  go install github.com/mosimosi228/pinger/cmd/pinger@latest
  sudo "$(go env GOPATH)/bin/pinger" install`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return install.ExecuteWith(install.Options{
			Force:   installForce,
			NoStart: installNoStart,
		})
	},
}

func init() {
	installCmd.Flags().BoolVar(&installForce, "force", false, "overwrite existing /etc/pinger/pinger.yaml")
	installCmd.Flags().BoolVar(&installNoStart, "no-start", false, "enable unit but do not start the service")
}
