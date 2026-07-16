package config

var Environments *Config

func (c *Config) IsDevelopment() bool {
	return c.App.Env == "development" || c.App.Env == "dev" || c.App.Env == "test"
}

func (c *Config) IsProduction() bool {
	return c.App.Env == "production" || c.App.Env == "prod"
}

func (c *Config) DBPath() string {
	return c.SQLite.Path
}
