package install

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"strings"
)

type UninstallOptions struct {
	// Purge also removes config, data, logs, and the system user.
	Purge bool
}

// Uninstall removes the systemd service and binary (requires root).
func Uninstall(opt UninstallOptions) error {
	if os.Geteuid() != 0 {
		return fmt.Errorf("pinger uninstall must be run as root (try: sudo pinger uninstall)")
	}

	fmt.Println("→ uninstalling Pinger…")

	_ = runIgnore("systemctl", "stop", "pinger.service")
	fmt.Println("✓ service: stopped")

	_ = runIgnore("systemctl", "disable", "pinger.service")
	fmt.Println("✓ service: disabled")

	if err := removeFile(unitPath); err != nil {
		return err
	}
	fmt.Printf("✓ removed: %s\n", unitPath)

	_ = runIgnore("systemctl", "daemon-reload")
	_ = runIgnore("systemctl", "reset-failed", "pinger.service")

	if err := removeFile(binPath); err != nil {
		return err
	}
	fmt.Printf("✓ removed: %s\n", binPath)

	if opt.Purge {
		for _, dir := range []string{etcDir, libDir, logDir} {
			if err := os.RemoveAll(dir); err != nil {
				return fmt.Errorf("remove %s: %w", dir, err)
			}
			fmt.Printf("✓ removed: %s\n", dir)
		}
		if err := removeSystemUser(); err != nil {
			return err
		}
	} else {
		fmt.Println("· kept data (use --purge to remove config, database, logs, and user):")
		fmt.Println("    " + etcDir)
		fmt.Println("    " + libDir)
		fmt.Println("    " + logDir)
	}

	fmt.Println()
	fmt.Println("Pinger is uninstalled.")
	return nil
}

func removeFile(path string) error {
	err := os.Remove(path)
	if err == nil || os.IsNotExist(err) {
		return nil
	}
	return fmt.Errorf("remove %s: %w", path, err)
}

func removeSystemUser() error {
	if _, err := user.Lookup(serviceUser); err != nil {
		return nil
	}
	cmd := exec.Command("userdel", serviceUser)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("remove user %q: %w (%s)", serviceUser, err, strings.TrimSpace(string(out)))
	}
	fmt.Printf("✓ user:   %s removed\n", serviceUser)
	return nil
}

func runIgnore(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	_ = cmd.Run()
	return nil
}
