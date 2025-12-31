ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS triage_status TEXT NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_evidence_items_tenant_status_created
  ON evidence_items(tenant_id, triage_status, created_at DESC);


