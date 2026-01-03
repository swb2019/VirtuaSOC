-- Evidence enrichment:
-- - extracted indicators (IOCs) normalized for search and correlation
-- - stored per evidence item, but kept as a separate table for fast queries + dedupe

CREATE TABLE IF NOT EXISTS evidence_indicators (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'url' | 'domain' | 'ip' | 'email' | 'hash' | 'cve'
  value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'text', -- where it was extracted from (e.g. 'source_uri' | 'content_text' | 'snapshot')
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_indicators_unique
  ON evidence_indicators (tenant_id, evidence_id, kind, normalized_value);

CREATE INDEX IF NOT EXISTS idx_evidence_indicators_tenant_kind_value
  ON evidence_indicators (tenant_id, kind, normalized_value);

CREATE INDEX IF NOT EXISTS idx_evidence_indicators_tenant_evidence_created
  ON evidence_indicators (tenant_id, evidence_id, created_at DESC);


