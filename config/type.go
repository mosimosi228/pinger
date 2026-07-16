package config

const (
	DefaultConfigPath = "/etc/pinger/pinger.yaml"
)

// Config holds application settings loaded from defaults, YAML file and env.
type Config struct {
	App struct {
		Name    string `yaml:"name"`
		Addr    string `yaml:"addr"`
		Port    string `yaml:"port"`
		Env     string `yaml:"env"`
		Workers int    `yaml:"workers"`
	} `yaml:"app"`
	Logs struct {
		Level       string `yaml:"level"`
		OutFilename string `yaml:"out_filename"`
		OutDir      string `yaml:"out_dir"`
	} `yaml:"logs"`
	Security struct {
		JWTSecret string `yaml:"jwt_secret"`
		APIKey    string `yaml:"api_key"`
	} `yaml:"security"`
	SQLite struct {
		Path string `yaml:"path"`
	} `yaml:"sqlite"`
}
