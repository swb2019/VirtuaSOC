# Facility OSINT: Geofenced alerts (Facilities + Reputation)

This module is designed for **Fortune 500** physical security + intelligence teams monitoring:
- facilities & residents
- travelers and site visitors
- product transportation & adjacent disruption
- reputation & crisis events near sites

It turns **geo-tagged OSINT evidence** into deterministic, reviewable **signals** (and optional Flash Alert drafts).

## What it does
- You define **geofences** (center + radius) around facilities or other protected locations.
- When evidence arrives with coordinates (`evidence_items.metadata.geo`), the worker generates `signals.kind = facility_geofence` when the evidence is within a geofence radius.
- The match is idempotent via `geofence_matches(tenant_id, geofence_id, evidence_id)`.
- If **Product Factory** is enabled, high-severity geofence signals can auto-draft a **Flash Alert**.

## Setup in the Factory app
1. Create (optional) **Facility entities**
   - Go to `/entities`
   - Create an entity with type `FACILITY` and a recognizable name

2. Create geofences
   - Go to `/geofences`
   - Set:
     - Name (e.g. “HQ Campus”)
     - Kind: `facility` or `reputation`
     - Center lat/lon
     - Radius km
     - Optional: link to a `FACILITY` entity
     - Tags: use tags like `protest`, `violence`, `activism`, `negative_media`, `regulatory`

3. Ingest geo-tagged OSINT evidence
   - Manual: go to `/evidence` and set **Geo lat/lon** (optional)
   - Webhook: POST to `/api/ingest/webhook` with a JSON body that includes `lat/lon` or `geo: {lat, lon}`

4. Observe outputs
   - `/signals`: look for `kind=facility_geofence` with geofence name + distance
   - `/evidence/[id]`: see geofence matches and related facility signals

## Evidence geo format
The worker reads geo coordinates from:
- `metadata.geo.lat` / `metadata.geo.lon`
- `metadata.location.lat` / `metadata.location.lon`
- `metadata.raw.lat` / `metadata.raw.lon` (webhook-style)

## Tuning (analyst tradecraft)
This module is **rule-first** and evidence-bound:
- distance bands drive score/severity
- tags contribute deterministically (facility + reputation sets)
- no LLM geocoding or inferred coordinates

## Tables
- `geofences`: definitions per tenant
- `geofence_matches`: evidence↔geofence match records
- `signals`: includes `facility_geofence`

