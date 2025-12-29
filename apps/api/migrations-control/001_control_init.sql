CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

-- Optional local users (dev/break-glass). In SaaS, prefer OIDC.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS tenant_auth_providers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issuer TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT 'openid profile email',
  role_claim_path TEXT NOT NULL DEFAULT 'groups',
  role_mapping JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_auth_provider_unique
  ON tenant_auth_providers(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_db_credentials (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encrypted_dsn TEXT NOT NULL,
  db_name TEXT NOT NULL,
  db_user TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_db_credentials_unique
  ON tenant_db_credentials(tenant_id);


