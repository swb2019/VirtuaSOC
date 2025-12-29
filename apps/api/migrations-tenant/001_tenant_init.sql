CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_at TIMESTAMPTZ NOT NULL,
  source_type TEXT NOT NULL,
  source_uri TEXT,
  title TEXT,
  summary TEXT,
  content_text TEXT,
  content_hash TEXT,
  handling TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(summary,'') || ' ' ||
      coalesce(content_text,'')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_evidence_items_search_tsv ON evidence_items USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_evidence_items_tenant_created ON evidence_items (tenant_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_unique_source_uri
  ON evidence_items (tenant_id, source_uri)
  WHERE source_uri IS NOT NULL;

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  definition_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  handling TEXT NOT NULL,
  severity TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  full_markdown TEXT,
  evidence_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  created_by_user_id UUID,
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_tenant_created ON reports (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_status ON reports (tenant_id, status);

CREATE TABLE IF NOT EXISTS report_sections (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  evidence_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  PRIMARY KEY (report_id, id)
);

CREATE TABLE IF NOT EXISTS distribution_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_distribution_tenant_created ON distribution_records (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  actor_user_id UUID,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_log (tenant_id, created_at DESC);


