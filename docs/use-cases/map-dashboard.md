# Map dashboard (Factory `/map`)

The Factory app includes a MapLibre-based dashboard for **facility security**, **reputation**, and **transportation/travel corridor** monitoring.

## What it shows
- **Facilities**: `entities.type = FACILITY` with geo coordinates in metadata
- **Geofences**: facility/reputation geofences (center + radius)
- **Routes**: corridor routes (LineString + corridor buffer)
- **Signals**: recent geo signals:
  - `facility_geofence`
  - `route_corridor`

## How to use it
1. Define protected locations
   - Create `FACILITY` entities with geo (or link geofences to a facility)
   - Create geofences at `/geofences`

2. Define routes/corridors
   - Go to `/map` → **Draw route** → click points → **Save route**

3. Bring geo-tagged OSINT
   - Manual geo: `/evidence`
   - GeoRSS feeds: `/evidence` (see `docs/use-cases/geo-connectors.md`)
   - Webhook geo: `/api/ingest/webhook`

4. Watch alerts
   - Panel shows recent geo alerts with click-through to evidence
   - Map overlays geofences and routes

## Why MapLibre
- No external map API keys required
- Works with self-hosted (packaged) basemap assets


