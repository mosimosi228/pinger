package install

import (
	_ "embed"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/mosimosi228/kit/utils"
	"github.com/mosimosi228/pinger/config"
)

const (
	etcDir         = "/etc/pinger"
	configPath     = config.DefaultConfigPath
	libDir         = "/var/lib/pinger"
	logDir         = "/var/log/pinger"
	binPath        = "/usr/local/bin/pinger"
	unitPath       = "/etc/systemd/system/pinger.service"
	serviceUser    = "pinger"
	serviceGroup   = "pinger"
	jwtPlaceholder = "__JWT_SECRET__"
	binPlaceholder = "__BIN__"
)

//go:embed pinger.yaml.prod.dist
var prodConfigTemplate []byte

//go:embed pinger.service
var unitTemplate []byte

type Options struct {
	Force   bool
	NoStart bool
}

// Execute installs Pinger as a systemd service (requires root).
func Execute() error {
	return ExecuteWith(Options{})
}

func ExecuteWith(opt Options) error {
	if os.Geteuid() != 0 {
		return fmt.Errorf("pinger install must be run as root (try: sudo pinger install)")
	}

	fmt.Println("→ installing Pinger…")

	if err := ensureSystemUser(); err != nil {
		return err
	}

	if err := ensureDirs(); err != nil {
		return err
	}

	installedBin, err := installBinary()
	if err != nil {
		return err
	}
	fmt.Printf("✓ binary: %s\n", installedBin)

	if err := writeConfig(opt.Force); err != nil {
		return err
	}
	fmt.Printf("✓ config: %s\n", configPath)

	if err := writeUnit(installedBin); err != nil {
		return err
	}
	fmt.Printf("✓ unit:   %s\n", unitPath)

	if err := chownTree(etcDir, serviceUser, serviceGroup); err != nil {
		return err
	}
	if err := chownTree(libDir, serviceUser, serviceGroup); err != nil {
		return err
	}
	if err := chownTree(logDir, serviceUser, serviceGroup); err != nil {
		return err
	}

	if err := run("systemctl", "daemon-reload"); err != nil {
		return err
	}
	if err := run("systemctl", "enable", "pinger.service"); err != nil {
		return err
	}

	if !opt.NoStart {
		if err := run("systemctl", "restart", "pinger.service"); err != nil {
			return err
		}
		fmt.Println("✓ service: pinger.service started")
	} else {
		fmt.Println("✓ service: enabled (not started, --no-start)")
	}

	fmt.Println()
	fmt.Println("Pinger is installed.")
	fmt.Println("  config:  " + configPath)
	fmt.Println("  logs:    " + filepath.Join(logDir, "pinger.log"))
	fmt.Println("  status:  systemctl status pinger")
	fmt.Println("  journal: journalctl -u pinger -f")
	return nil
}

func ensureSystemUser() error {
	if _, err := user.Lookup(serviceUser); err == nil {
		return nil
	}
	// useradd -r -s /usr/sbin/nologin -d /var/lib/pinger -M pinger
	cmd := exec.Command("useradd", "-r", "-s", "/usr/sbin/nologin", "-d", libDir, "-M", serviceUser)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("create user %q: %w (%s)", serviceUser, err, strings.TrimSpace(string(out)))
	}
	fmt.Printf("✓ user:   %s\n", serviceUser)
	return nil
}

func ensureDirs() error {
	for _, dir := range []string{etcDir, libDir, logDir} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("mkdir %s: %w", dir, err)
		}
	}
	return nil
}

func installBinary() (string, error) {
	self, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("resolve executable: %w", err)
	}
	self, err = filepath.EvalSymlinks(self)
	if err != nil {
		return "", fmt.Errorf("resolve executable symlink: %w", err)
	}

	if self == binPath {
		return binPath, nil
	}

	src, err := os.Open(self)
	if err != nil {
		return "", err
	}
	defer src.Close()

	tmp := binPath + ".new"
	dst, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return "", fmt.Errorf("write %s: %w", tmp, err)
	}
	if _, err := io.Copy(dst, src); err != nil {
		_ = dst.Close()
		_ = os.Remove(tmp)
		return "", err
	}
	if err := dst.Close(); err != nil {
		_ = os.Remove(tmp)
		return "", err
	}
	if err := os.Rename(tmp, binPath); err != nil {
		_ = os.Remove(tmp)
		return "", err
	}
	return binPath, nil
}

func writeConfig(force bool) error {
	if !force {
		if _, err := os.Stat(configPath); err == nil {
			fmt.Printf("· config exists, keep: %s (use --force to overwrite)\n", configPath)
			return nil
		}
	}

	secret, err := utils.GenerateJWTSecret()
	if err != nil || secret == "" {
		secret = "change-me-" + strconv.FormatInt(int64(os.Getpid()), 10)
	}

	body := strings.ReplaceAll(string(prodConfigTemplate), jwtPlaceholder, secret)
	if err := os.WriteFile(configPath, []byte(body), 0o640); err != nil {
		return fmt.Errorf("write config: %w", err)
	}
	return nil
}

func writeUnit(bin string) error {
	body := strings.ReplaceAll(string(unitTemplate), binPlaceholder, bin)
	if err := os.WriteFile(unitPath, []byte(body), 0o644); err != nil {
		return fmt.Errorf("write unit: %w", err)
	}
	return nil
}

func chownTree(root, username, groupname string) error {
	u, err := user.Lookup(username)
	if err != nil {
		return err
	}
	g, err := user.LookupGroup(groupname)
	if err != nil {
		// fallback: same name as user
		g, err = user.LookupGroup(username)
		if err != nil {
			return err
		}
	}
	uid, _ := strconv.Atoi(u.Uid)
	gid, _ := strconv.Atoi(g.Gid)

	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		return os.Chown(path, uid, gid)
	})
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("%s %s: %w", name, strings.Join(args, " "), err)
	}
	return nil
}
