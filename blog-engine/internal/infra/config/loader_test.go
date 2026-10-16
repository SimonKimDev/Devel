package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadConfig_Success(t *testing.T) {
	expectedClientID := "12345"
	t.Setenv(ClientIDEnvVar, expectedClientID)

	cfg, err := Load(filepath.Join("testdata", "test.yaml"))
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	checks := []struct {
		name     string
		got      any
		expected any
	}{
		{"environment", cfg.Env, "test"},
		{"server.host", cfg.Server.Host, "1.2.3.4"},
		{"server.port", cfg.Server.Port, "567"},
		{"server.allowed_origins", strings.Join(cfg.Server.AllowedOrigins, ","), "http://localhost:3000"},
		{"database.enabled", cfg.Database.Enabled, true},
		{"database.db_url_secret_key", cfg.Database.URLKeyVaultKey, "test_connection_string"},
		{"database.db_name_secret_key", cfg.Database.NameKeyVaultKey, "test_db"},
		{"database.db_user_secret_key", cfg.Database.UserKeyVaultKey, "test_user"},
		{"database.aad_scope", cfg.Database.AADScope, "http://test.com"},
		{"database.port", cfg.Database.Port, 5432},
		{"azure.keyvaulturl", cfg.Azure.KeyVaultURL, "test_keyvault"},
		{"azure client ID (from env)", cfg.Azure.ClientID, expectedClientID},
	}

	for _, c := range checks {
		if c.got != c.expected {
			t.Errorf("%s: expected %v, got %v", c.name, c.expected, c.got)
		}
	}
}

func TestLoadConfig_ClientIDIsOptional(t *testing.T) {
	t.Setenv(ClientIDEnvVar, "")

	cfg, err := Load(filepath.Join("testdata", "test.yaml"))
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if cfg.Azure.ClientID != "" {
		t.Errorf("expected empty client ID, got %q", cfg.Azure.ClientID)
	}
}

func TestLoadConfig_DatabaseDisabledNeedsNoDatabaseSettings(t *testing.T) {
	path := writeConfig(t, `
environment: "prod"
server:
  port: "18080"
database:
  enabled: false
`)

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if cfg.Database.Enabled {
		t.Error("expected database to be disabled")
	}
}

func TestLoadConfig_FailsWhenDatabaseEnabledWithoutSettings(t *testing.T) {
	path := writeConfig(t, `
environment: "prod"
server:
  port: "18080"
database:
  enabled: true
`)

	_, err := Load(path)
	if err == nil {
		t.Fatal("expected an error for missing database settings, got nil")
	}

	for _, key := range []string{"azure.keyvaulturl", "database.db_url_secret_key", "database.aad_scope", "database.port"} {
		if !strings.Contains(err.Error(), key) {
			t.Errorf("expected error to mention %q, got %v", key, err)
		}
	}
}

func TestLoadConfig_FailsWithoutPort(t *testing.T) {
	path := writeConfig(t, `
environment: "dev"
server:
  host: "localhost"
`)

	_, err := Load(path)
	if err == nil || !strings.Contains(err.Error(), "server.port") {
		t.Fatalf("expected a server.port error, got %v", err)
	}
}

func TestLoadConfig_FailsOnUnknownField(t *testing.T) {
	path := writeConfig(t, `
environment: "dev"
server:
  port: "18080"
database:
  ports: 5432
`)

	_, err := Load(path)
	if err == nil {
		t.Fatal("expected an error for the unknown field, got nil")
	}
}

func TestLoadConfig_FailsWhenFileMissing(t *testing.T) {
	_, err := Load(filepath.Join(t.TempDir(), "missing.yaml"))
	if err == nil {
		t.Fatal("expected an error for a missing file, got nil")
	}
}

// The shipped configs must stay loadable; the server reads one of them at startup.
func TestShippedConfigsLoad(t *testing.T) {
	t.Setenv(ClientIDEnvVar, "")

	for _, appEnv := range []string{"dev", "prod"} {
		t.Run(appEnv, func(t *testing.T) {
			cfg, err := Load(Path(filepath.Join("..", "..", ".."), appEnv))
			if err != nil {
				t.Fatalf("Load returned error: %v", err)
			}

			if cfg.Env != appEnv {
				t.Errorf("expected environment %q, got %q", appEnv, cfg.Env)
			}
		})
	}
}

func TestPath(t *testing.T) {
	tests := []struct {
		appEnv   string
		expected string
	}{
		{"prod", "prod.yaml"},
		{"dev", "dev.yaml"},
		{"", "dev.yaml"},
		{"staging", "dev.yaml"},
	}

	for _, tt := range tests {
		got := Path("root", tt.appEnv)
		expected := filepath.Join("root", "configs", tt.expected)

		if got != expected {
			t.Errorf("Path(%q): expected %q, got %q", tt.appEnv, expected, got)
		}
	}
}

func writeConfig(t *testing.T, content string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "config.yaml")

	err := os.WriteFile(path, []byte(content), 0o600)
	if err != nil {
		t.Fatalf("write config: %v", err)
	}

	return path
}
