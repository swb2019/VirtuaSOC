-- Geofences (tenant-plane)
-- Purpose: facility security + reputation monitoring using deterministic, evidence-bound geo proximity.
-- Note: we intentionally avoid PostGIS to keep deployments lightweight.

CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  kind TEXT NOT NULL, -- 'facility' | 'reputation' (extend as needed)
  center_lat DOUBLE PRECISION NOT NULL,
  center_lon DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE geofences
  DROP CONSTRAINT IF EXISTS geofences_lat_check;
ALTER TABLE geofences
  ADD CONSTRAINT geofences_lat_check CHECK (center_lat BETWEEN -90 AND 90);

ALTER TABLE geofences
  DROP CONSTRAINT IF EXISTS geofences_lon_check;
ALTER TABLE geofences
  ADD CONSTRAINT geofences_lon_check CHECK (center_lon BETWEEN -180 AND 180);

ALTER TABLE geofences
  DROP CONSTRAINT IF EXISTS geofences_radius_check;
ALTER TABLE geofences
  ADD CONSTRAINT geofences_radius_check CHECK (radius_km > 0 AND radius_km <= 500);

CREATE INDEX IF NOT EXISTS idx_geofences_tenant_enabled_lat
  ON geofences (tenant_id, enabled, center_lat);
CREATE INDEX IF NOT EXISTS idx_geofences_tenant_enabled_lon
  ON geofences (tenant_id, enabled, center_lon);
CREATE INDEX IF NOT EXISTS idx_geofences_tenant_entity
  ON geofences (tenant_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_geofences_tenant_created
  ON geofences (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS geofence_matches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  distance_km DOUBLE PRECISION,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_geofence_matches_unique
  ON geofence_matches (tenant_id, geofence_id, evidence_id);

CREATE INDEX IF NOT EXISTS idx_geofence_matches_tenant_evidence_created
  ON geofence_matches (tenant_id, evidence_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_matches_tenant_geofence_created
  ON geofence_matches (tenant_id, geofence_id, created_at DESC);


