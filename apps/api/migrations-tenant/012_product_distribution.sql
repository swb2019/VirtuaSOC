-- Product distribution + exports (PDF) for Product Factory (M6).

CREATE TABLE IF NOT EXISTS product_exports (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_bytes BYTEA,
  pdf_sha256 TEXT,
  content_type TEXT NOT NULL DEFAULT 'application/pdf'
);

CREATE INDEX IF NOT EXISTS idx_product_exports_tenant_updated
  ON product_exports(tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_distribution_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'email' | 'webhook' | 'teams_webhook'
  target TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sending' | 'sent' | 'failed'
  sent_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE product_distribution_records
  DROP CONSTRAINT IF EXISTS product_distribution_records_status_check;
ALTER TABLE product_distribution_records
  ADD CONSTRAINT product_distribution_records_status_check CHECK (status IN ('pending','sending','sent','failed'));

CREATE INDEX IF NOT EXISTS idx_product_distribution_tenant_created
  ON product_distribution_records(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_distribution_product_created
  ON product_distribution_records(tenant_id, product_id, created_at DESC);


