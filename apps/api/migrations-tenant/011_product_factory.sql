-- Product Factory (config-driven) core tables.
-- These tables are tenant-plane (DB-per-tenant) and are designed to support many product types via configuration.

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  json_schema JSONB NOT NULL DEFAULT '{}'::JSONB,
  changelog TEXT
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_tenant_created
  ON prompt_versions(tenant_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_versions_unique
  ON prompt_versions(tenant_id, name, schema_version);

CREATE TABLE IF NOT EXISTS product_configs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_type TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cadence TEXT,
  trigger JSONB NOT NULL DEFAULT '{}'::JSONB,
  scope JSONB NOT NULL DEFAULT '{}'::JSONB,
  template_markdown TEXT NOT NULL DEFAULT '',
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  distribution_rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  review_policy JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_configs_unique_type
  ON product_configs(tenant_id, product_type);

CREATE INDEX IF NOT EXISTS idx_product_configs_tenant_created
  ON product_configs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',

  -- Tradecraft-required structured fields
  confidence_level TEXT NOT NULL DEFAULT 'UNKNOWN',
  confidence_rationale TEXT NOT NULL DEFAULT '',

  likelihood_term TEXT,
  likelihood_min DOUBLE PRECISION,
  likelihood_max DOUBLE PRECISION,

  risk_likelihood INT,
  risk_impact INT,

  key_judgments TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  indicators TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  change_from_last TEXT,

  content_markdown TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::JSONB,

  evidence_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  entity_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],

  created_by_user_id TEXT,
  approved_by_user_id TEXT,
  approved_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ
);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_status_check CHECK (status IN ('draft','in_review','approved','distributed','rejected'));

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_risk_check;
ALTER TABLE products
  ADD CONSTRAINT products_risk_check CHECK (
    (risk_likelihood IS NULL OR (risk_likelihood BETWEEN 1 AND 5))
    AND (risk_impact IS NULL OR (risk_impact BETWEEN 1 AND 5))
  );

CREATE INDEX IF NOT EXISTS idx_products_tenant_created
  ON products(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_tenant_type_status
  ON products(tenant_id, product_type, status);

CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  notes TEXT
);

ALTER TABLE action_items
  DROP CONSTRAINT IF EXISTS action_items_status_check;
ALTER TABLE action_items
  ADD CONSTRAINT action_items_status_check CHECK (status IN ('open','in_progress','done','cancelled'));

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_due
  ON action_items(tenant_id, due_at);

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_created
  ON action_items(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS run_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  model TEXT,
  prompt_version_id UUID,
  input JSONB NOT NULL DEFAULT '{}'::JSONB,
  output JSONB NOT NULL DEFAULT '{}'::JSONB,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_run_logs_tenant_created
  ON run_logs(tenant_id, created_at DESC);


