ALTER TABLE tenant_auth_providers
  ADD COLUMN IF NOT EXISTS audience TEXT;

ALTER TABLE tenant_auth_providers
  ADD COLUMN IF NOT EXISTS enforce_audience BOOLEAN NOT NULL DEFAULT false;


