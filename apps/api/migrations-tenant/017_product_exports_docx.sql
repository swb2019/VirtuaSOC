-- Product exports: add DOCX storage alongside PDF.
-- Used by Product Factory (M6) for Fortune 500 GSOC distribution.

ALTER TABLE product_exports
  ADD COLUMN IF NOT EXISTS docx_bytes BYTEA,
  ADD COLUMN IF NOT EXISTS docx_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS docx_content_type TEXT;


