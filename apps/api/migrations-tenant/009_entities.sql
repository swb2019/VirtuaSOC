CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pii_flag BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE entities
  DROP CONSTRAINT IF EXISTS entities_type_check;
ALTER TABLE entities
  ADD CONSTRAINT entities_type_check CHECK (type IN ('PERSON','FACILITY','ROUTE','VENDOR','ORG'));

CREATE INDEX IF NOT EXISTS idx_entities_tenant_created
  ON entities(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entities_tenant_type
  ON entities(tenant_id, type);

CREATE TABLE IF NOT EXISTS evidence_entity_links (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_entity_unique
  ON evidence_entity_links(tenant_id, evidence_id, entity_id);

CREATE INDEX IF NOT EXISTS idx_evidence_entity_by_entity
  ON evidence_entity_links(tenant_id, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_entity_by_evidence
  ON evidence_entity_links(tenant_id, evidence_id, created_at DESC);


