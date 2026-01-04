# Transportation OSINT: Route corridor monitoring (travelers + product transportation)

This module lets a tenant define **ROUTE entities** as polylines with a buffer (“corridor”), then generates deterministic proximity signals when geo-tagged OSINT evidence lands near the corridor.

## What it does
- Analysts draw and save a route in the Factory app `/map`.
- Routes are stored as `entities.type = ROUTE` with:
  - `entities.metadata.routeGeometry`: GeoJSON `LineString` with `[lon,lat]` coordinates
  - `entities.metadata.corridorKm`: corridor buffer radius in kilometers
- When evidence arrives with coordinates (`evidence_items.metadata.geo`), the worker:
  - computes point→polyline distance (km)
  - inserts `route_corridor_matches` (idempotent by `(tenant_id, route_entity_id, evidence_id)`)
  - creates `signals.kind = route_corridor` linked to:
    - the evidence (`signal_evidence_links`)
    - the route entity (`signal_entity_links`)

## Setup in the Factory app
1. Draw and save a route
   - Go to `/map`
   - Click **Draw route**
   - Click points on the map to create a polyline (2+ points)
   - Set **Route name** and **Corridor (km)**
   - Click **Save route**

2. Ingest geo-tagged evidence
   - Manual: `/evidence` → enter **Geo lat/lon**
   - RSS: `/evidence` → add GeoRSS feeds (see `docs/use-cases/geo-connectors.md`)
   - Webhook: `/api/ingest/webhook` with `lat/lon` or `geo: {lat, lon}`

3. Observe outputs
   - `/signals`: look for `kind=route_corridor`
   - `/map`: routes and corridor lines render on the map; recent corridor alerts appear in the right panel
   - `/evidence/[id]`: evidence will list route corridor matches (if any)

## Scoring (deterministic)
Route corridor signals use rule-first scoring:
- distance bands (<=1km, <=5km, <=10km, <=25km)
- optional tag boosts (e.g. `cargo_theft`, `hijacking`, `closure`, `protest`, `violence`)
- source boosts (e.g. CISA advisories)

Tune corridor size + tags per tenant to control noise.

## Tables
- `route_corridor_matches`: evidence↔route match records (with `distance_km` and `closest_segment_index`)
- `signals`: includes `route_corridor`


