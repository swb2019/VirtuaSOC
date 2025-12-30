CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  actor_sub TEXT,
  actor_email TEXT,

  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created_at
  ON platform_audit_log(created_at DESC);


