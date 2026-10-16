package domain

// Config is the application configuration, loaded from configs/<env>.yaml.
type Config struct {
	Env      string         `yaml:"environment"`
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Azure    AzureConfig    `yaml:"azure"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port string `yaml:"port"`
	// AllowedOrigins enables in-app CORS for local development. Leave it empty
	// in production, where Container Apps ingress applies the CORS policy.
	AllowedOrigins []string `yaml:"allowed_origins"`
}

type DatabaseConfig struct {
	// Enabled turns on the Postgres connection and the /api/blogpost routes.
	Enabled bool `yaml:"enabled"`
	// The *KeyVaultKey fields are Key Vault secret names, not the values.
	URLKeyVaultKey  string `yaml:"db_url_secret_key"`
	NameKeyVaultKey string `yaml:"db_name_secret_key"`
	UserKeyVaultKey string `yaml:"db_user_secret_key"`
	AADScope        string `yaml:"aad_scope"`
	Port            int    `yaml:"port"`
}

type AzureConfig struct {
	KeyVaultURL string `yaml:"keyvaulturl"`
	// ClientID selects a user-assigned managed identity in prod. It comes from
	// the AZURE_CLIENT_ID environment variable, not from YAML.
	ClientID string `yaml:"-"`
}
