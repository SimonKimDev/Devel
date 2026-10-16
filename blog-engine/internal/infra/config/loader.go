package config

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/SimonKimDev/Devel/blog-engine/internal/domain"
	"go.yaml.in/yaml/v3"
)

// ClientIDEnvVar holds the client ID of a user-assigned managed identity.
const ClientIDEnvVar = "AZURE_CLIENT_ID"

// Path returns the config file for appEnv: configs/prod.yaml when appEnv is
// "prod", otherwise configs/dev.yaml, relative to dir.
func Path(dir, appEnv string) string {
	name := "dev.yaml"
	if appEnv == "prod" {
		name = "prod.yaml"
	}

	return filepath.Join(dir, "configs", name)
}

// Load reads and validates the YAML config at path. Unknown keys are rejected
// so typos fail fast instead of silently using defaults.
func Load(path string) (*domain.Config, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg domain.Config

	decoder := yaml.NewDecoder(bytes.NewReader(content))
	decoder.KnownFields(true)

	err = decoder.Decode(&cfg)
	if err != nil {
		return nil, fmt.Errorf("parse config file %s: %w", path, err)
	}

	cfg.Azure.ClientID = os.Getenv(ClientIDEnvVar)

	err = validate(&cfg)
	if err != nil {
		return nil, fmt.Errorf("invalid config file %s: %w", path, err)
	}

	return &cfg, nil
}

func validate(cfg *domain.Config) error {
	var missing []string

	if cfg.Server.Port == "" {
		missing = append(missing, "server.port")
	}

	if cfg.Database.Enabled {
		required := []struct{ key, value string }{
			{"azure.keyvaulturl", cfg.Azure.KeyVaultURL},
			{"database.db_url_secret_key", cfg.Database.URLKeyVaultKey},
			{"database.db_name_secret_key", cfg.Database.NameKeyVaultKey},
			{"database.db_user_secret_key", cfg.Database.UserKeyVaultKey},
			{"database.aad_scope", cfg.Database.AADScope},
		}

		for _, field := range required {
			if field.value == "" {
				missing = append(missing, field.key)
			}
		}

		if cfg.Database.Port == 0 {
			missing = append(missing, "database.port")
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required values: %s", strings.Join(missing, ", "))
	}

	return nil
}
