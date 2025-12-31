CREATE TABLE IF NOT EXISTS ingest_prefs (
  tenant_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rss_default_tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  rss_auto_triage_status TEXT NOT NULL DEFAULT 'new'
);

-- Guardrails: only supported triage statuses.
ALTER TABLE ingest_prefs
  DROP CONSTRAINT IF EXISTS ingest_prefs_rss_auto_triage_status_check;
ALTER TABLE ingest_prefs
  ADD CONSTRAINT ingest_prefs_rss_auto_triage_status_check
  CHECK (rss_auto_triage_status IN ('new','triaged'));


