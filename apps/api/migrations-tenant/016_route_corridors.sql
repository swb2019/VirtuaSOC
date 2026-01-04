-- Route corridor monitoring (tenant-plane)
-- Used for traveler + product transportation risk along routes.

CREATE TABLE IF NOT EXISTS route_corridor_matches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  route_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  distance_km DOUBLE PRECISION,
  closest_segment_index INT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_route_corridor_matches_unique
  ON route_corridor_matches (tenant_id, route_entity_id, evidence_id);

CREATE INDEX IF NOT EXISTS idx_route_corridor_matches_tenant_evidence_created
  ON route_corridor_matches (tenant_id, evidence_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_route_corridor_matches_tenant_route_created
  ON route_corridor_matches (tenant_id, route_entity_id, created_at DESC);


