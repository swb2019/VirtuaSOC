CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_unique_content_hash
  ON evidence_items (tenant_id, content_hash)
  WHERE content_hash IS NOT NULL;


