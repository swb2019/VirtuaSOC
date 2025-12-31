CREATE TABLE IF NOT EXISTS distribution_targets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind TEXT NOT NULL,
  label TEXT,
  value TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true
);

-- Ensure idempotency for email entries per-tenant, and a single teams_webhook per-tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_distribution_targets_unique_email
  ON distribution_targets(tenant_id, kind, value)
  WHERE kind = 'email';

CREATE UNIQUE INDEX IF NOT EXISTS idx_distribution_targets_unique_teams
  ON distribution_targets(tenant_id, kind)
  WHERE kind = 'teams_webhook';

CREATE INDEX IF NOT EXISTS idx_distribution_targets_tenant_created
  ON distribution_targets(tenant_id, created_at DESC);


