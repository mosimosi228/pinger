package config

import (
	"fmt"
	"github.com/mosimosi228/pinger/pkg/utils"
	"os"
	"path/filepath"
)

// MustLoad loads config and stores it in Environments.
func MustLoad(configPath string) error {
	cfg, err := Load(configPath)
	if err != nil {
		return err
	}

	Environments = cfg
	return nil
}

// Load applies config sources in order: defaults → YAML file (if found).
func Load(configPath string) (*Config, error) {
	cfg := defaultConfig()

	path, found, err := resolveConfigPath(configPath)
	if err != nil {
		return nil, err
	}

	if found {
		if err := utils.LoadYAML[*Config](path, cfg); err != nil {
			return nil, fmt.Errorf("load config file %q: %w", path, err)
		}
	}

	return cfg, nil
}

func defaultConfig() *Config {
	cfg := &Config{}

	cfg.App.Name = "Pinger"
	cfg.App.Env = "prod"
	cfg.App.Addr = "http://localhost:8080"
	cfg.App.Port = "8080"
	cfg.App.Workers = 4

	cfg.Logs.Level = "info"
	cfg.Logs.OutDir = "/var/log/pinger"
	cfg.Logs.OutFilename = "pinger.log"

	cfg.Security.JWTSecret, _ = utils.GenerateJWTSecret()

	cfg.SQLite.Path = "/etc/pinger/pinger.db"

	return cfg
}

func resolveConfigPath(configPath string) (string, bool, error) {
	if configPath != "" {
		if _, err := os.Stat(configPath); err != nil {
			if os.IsNotExist(err) {
				return "", false, fmt.Errorf("config file not found: %s", configPath)
			}
			return "", false, err
		}

		abs, err := filepath.Abs(configPath)
		if err != nil {
			return configPath, true, nil
		}

		return abs, true, nil
	}

	candidates := []string{
		DefaultConfigPath,
		"pinger.yaml",
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			abs, err := filepath.Abs(candidate)
			if err != nil {
				return candidate, true, nil
			}
			return abs, true, nil
		}
	}

	return "", false, nil
}
