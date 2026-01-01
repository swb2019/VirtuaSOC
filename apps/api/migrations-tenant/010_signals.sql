CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  severity INT NOT NULL,
  score INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  rationale JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE signals
  DROP CONSTRAINT IF EXISTS signals_severity_check;
ALTER TABLE signals
  ADD CONSTRAINT signals_severity_check CHECK (severity BETWEEN 1 AND 5);

ALTER TABLE signals
  DROP CONSTRAINT IF EXISTS signals_score_check;
ALTER TABLE signals
  ADD CONSTRAINT signals_score_check CHECK (score BETWEEN 0 AND 100);

ALTER TABLE signals
  DROP CONSTRAINT IF EXISTS signals_status_check;
ALTER TABLE signals
  ADD CONSTRAINT signals_status_check CHECK (status IN ('open','closed'));

CREATE INDEX IF NOT EXISTS idx_signals_tenant_created
  ON signals(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_tenant_severity
  ON signals(tenant_id, severity DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS signal_evidence_links (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_evidence_unique
  ON signal_evidence_links(tenant_id, signal_id, evidence_id);

-- One signal per evidence (M4 MVP). This can be relaxed later.
CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_one_per_evidence
  ON signal_evidence_links(tenant_id, evidence_id);

CREATE INDEX IF NOT EXISTS idx_signal_evidence_by_signal
  ON signal_evidence_links(tenant_id, signal_id, created_at DESC);

CREATE TABLE IF NOT EXISTS signal_entity_links (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_entity_unique
  ON signal_entity_links(tenant_id, signal_id, entity_id);

CREATE INDEX IF NOT EXISTS idx_signal_entity_by_signal
  ON signal_entity_links(tenant_id, signal_id, created_at DESC);


