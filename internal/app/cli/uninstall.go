package cli

import (
	"github.com/mosimosi228/pinger/internal/infra/usecase/install"
	"github.com/spf13/cobra"
)

var uninstallPurge bool

var uninstallCmd = &cobra.Command{
	Use:   "uninstall",
	Short: "Uninstall pinger systemd service",
	Long: `Remove Pinger systemd installation (requires root).

By default removes:
  /usr/local/bin/pinger
  /etc/systemd/system/pinger.service

Stops and disables pinger.service first.

Config, database, logs, and system user are kept unless --purge is set.

Typical flow:
  sudo pinger uninstall
  sudo pinger uninstall --purge`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return install.Uninstall(install.UninstallOptions{
			Purge: uninstallPurge,
		})
	},
}

func init() {
	uninstallCmd.Flags().BoolVar(&uninstallPurge, "purge", false, "also remove /etc/pinger, /var/lib/pinger, /var/log/pinger, and user pinger")
}
