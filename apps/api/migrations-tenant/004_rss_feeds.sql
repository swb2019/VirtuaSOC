CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT NOT NULL,
  title TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rss_feeds_unique
  ON rss_feeds(tenant_id, url);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_tenant_created
  ON rss_feeds(tenant_id, created_at DESC);


