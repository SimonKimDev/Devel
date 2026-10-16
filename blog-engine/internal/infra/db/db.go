package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/policy"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azsecrets"
	"github.com/SimonKimDev/Devel/blog-engine/internal/domain"
	"github.com/lib/pq"
)

// latestVersion asks Key Vault for the current version of a secret.
const latestVersion = ""

// InitDatabase connects to Postgres with Microsoft Entra authentication. The
// server, database and user names come from Key Vault secrets.
func InitDatabase(ctx context.Context, settings *domain.Config) (*sql.DB, error) {
	cred, err := NewTokenCredential(settings)
	if err != nil {
		return nil, fmt.Errorf("create Azure credential: %w", err)
	}

	kvClient, err := azsecrets.NewClient(settings.Azure.KeyVaultURL, cred, nil)
	if err != nil {
		return nil, fmt.Errorf("create Key Vault client: %w", err)
	}

	secrets := secretStore{client: kvClient}

	serverURL, err := secrets.get(ctx, settings.Database.URLKeyVaultKey)
	if err != nil {
		return nil, err
	}

	dbName, err := secrets.get(ctx, settings.Database.NameKeyVaultKey)
	if err != nil {
		return nil, err
	}

	dbUser, err := secrets.get(ctx, settings.Database.UserKeyVaultKey)
	if err != nil {
		return nil, err
	}

	connector := &tokenConnector{
		dsn:   buildDSN(serverURL, settings.Database.Port, dbUser, dbName),
		cred:  cred,
		scope: settings.Database.AADScope,
	}

	database := sql.OpenDB(connector)

	err = database.PingContext(ctx)
	if err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return database, nil
}

// NewTokenCredential uses managed identity in prod and DefaultAzureCredential
// (Azure CLI, environment, and so on) everywhere else.
func NewTokenCredential(settings *domain.Config) (azcore.TokenCredential, error) {
	if settings.Env != "prod" {
		return azidentity.NewDefaultAzureCredential(nil)
	}

	options := &azidentity.ManagedIdentityCredentialOptions{}
	if settings.Azure.ClientID != "" {
		options.ID = azidentity.ClientID(settings.Azure.ClientID)
	}

	return azidentity.NewManagedIdentityCredential(options)
}

type secretStore struct {
	client *azsecrets.Client
}

func (s secretStore) get(ctx context.Context, name string) (string, error) {
	resp, err := s.client.GetSecret(ctx, name, latestVersion, nil)
	if err != nil {
		return "", fmt.Errorf("get Key Vault secret %q: %w", name, err)
	}

	if resp.Value == nil {
		return "", fmt.Errorf("Key Vault secret %q has no value", name)
	}

	return *resp.Value, nil
}

// tokenConnector opens each new connection with a fresh access token as the
// password. Entra tokens expire after about an hour, so a token fixed at
// startup would break any connection the pool opens later.
type tokenConnector struct {
	dsn   string
	cred  azcore.TokenCredential
	scope string
}

func (c *tokenConnector) Connect(ctx context.Context) (driver.Conn, error) {
	token, err := c.cred.GetToken(ctx, policy.TokenRequestOptions{Scopes: []string{c.scope}})
	if err != nil {
		return nil, fmt.Errorf("get database access token: %w", err)
	}

	connector, err := pq.NewConnector(c.dsn + " password=" + quoteDSNValue(token.Token))
	if err != nil {
		return nil, err
	}

	return connector.Connect(ctx)
}

func (c *tokenConnector) Driver() driver.Driver {
	return &pq.Driver{}
}

func buildDSN(host string, port int, user, dbName string) string {
	return fmt.Sprintf("host=%s port=%d user=%s dbname=%s sslmode=require",
		quoteDSNValue(host), port, quoteDSNValue(user), quoteDSNValue(dbName))
}

// quoteDSNValue quotes a value for a key=value Postgres connection string.
func quoteDSNValue(value string) string {
	escaped := strings.NewReplacer(`\`, `\\`, `'`, `\'`).Replace(value)
	return "'" + escaped + "'"
}
