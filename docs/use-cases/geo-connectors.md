# Geo OSINT ingestion (deterministic lat/lon)

Geo-tagged evidence is the input for geofences and route corridors. This project intentionally avoids “LLM geocoding” or inferred locations.

## Supported geo sources (today)

### 1) Manual geo entry (Factory)
- Go to `/evidence`
- Create evidence and fill **Geo lat/lon**
- This sets `evidence_items.metadata.geo = { lat, lon }`

### 2) Webhook geo (API)
POST to `/api/ingest/webhook` with a JSON body that includes either:
- `geo: { lat, lon }`, or
- `lat` and `lon`

The worker will read common nested locations as well (see `geoFromMetadata` in the worker).

### 3) GeoRSS / Atom feeds (RSS connector)
The worker’s RSS ingest supports extracting coordinates from:
- `georss:point` (GeoRSS), and
- `geo:lat` / `geo:long` (W3C geo)

When present, the worker stores:
- `evidence_items.metadata.geo`
- `evidence_items.metadata.geoSource` (e.g. `georss:point`)

#### Configure feeds (per tenant)
- In the Factory app, go to `/evidence`
- Add RSS/Atom feed URLs in the RSS section
- Optionally set tenant defaults in `ingest_prefs`:
  - `rss_default_tags` (to normalize downstream scoring)
  - `rss_auto_triage_status`

#### Example GeoRSS feeds (good for demos)
- USGS earthquakes (Atom/GeoRSS)
- GDACS disaster alerts (GeoRSS)

## How this connects to signals
- `facility_geofence`: evidence within a geofence radius
- `route_corridor`: evidence within a route corridor buffer

If geo is missing, these proximity signals will not be produced.


