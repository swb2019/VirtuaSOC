-- Per-tenant DOCX reference template (optional).
-- Used to style DOCX exports to match a corporate Word template.

CREATE TABLE IF NOT EXISTS tenant_docx_templates (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  label TEXT,
  docx_bytes BYTEA NOT NULL,
  docx_sha256 TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
);

CREATE INDEX IF NOT EXISTS idx_tenant_docx_templates_updated
  ON tenant_docx_templates(updated_at DESC);


