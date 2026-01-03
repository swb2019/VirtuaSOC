import { randomUUID } from "node:crypto";

import type { Db } from "../db.js";

export type EvaluateSignalJobPayload = {
  tenantId: string;
  evidenceId: string;
};

export type CreatedSignal = {
  id: string;
  kind: string;
  severity: number;
  score: number;
};

type EvidenceRow = {
  id: string;
  fetched_at: string;
  source_type: string;
  source_uri: string | null;
  title: string | null;
  summary: string | null;
  tags: string[];
  metadata: any;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreFromTags(tags: string[]): { score: number; reasons: string[] } {
  const t = new Set(tags.map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  let score = 0;
  const reasons: string[] = [];

  const add = (pts: number, reason: string) => {
    score += pts;
    reasons.push(`${reason} (+${pts})`);
  };

  if (t.has("critical")) add(30, "tag=critical");
  if (t.has("high")) add(20, "tag=high");
  if (t.has("medium")) add(10, "tag=medium");
  if (t.has("cisa")) add(10, "tag=cisa");
  if (t.has("ransomware")) add(15, "tag=ransomware");
  if (t.has("exploitation") || t.has("exploited")) add(20, "tag=exploitation");

  return { score, reasons };
}

function scoreFromRecency(fetchedAtIso: string): { score: number; reason: string } {
  const fetched = new Date(fetchedAtIso);
  const ageMs = Date.now() - fetched.getTime();
  const hours = ageMs / (1000 * 60 * 60);
  if (!Number.isFinite(hours)) return { score: 0, reason: "recency=unknown (+0)" };
  if (hours <= 6) return { score: 30, reason: "recency<=6h (+30)" };
  if (hours <= 24) return { score: 20, reason: "recency<=24h (+20)" };
  if (hours <= 72) return { score: 10, reason: "recency<=72h (+10)" };
  return { score: 0, reason: "recency>72h (+0)" };
}

function scoreFromSource(sourceType: string, sourceUri: string | null): { score: number; reasons: string[] } {
  const s = (sourceType ?? "").trim().toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (s === "webhook") {
    score += 15;
    reasons.push("source=webhook (+15)");
  } else if (s === "manual") {
    score += 10;
    reasons.push("source=manual (+10)");
  } else if (s === "rss") {
    score += 10;
    reasons.push("source=rss (+10)");
  }

  try {
    if (sourceUri) {
      const u = new URL(sourceUri);
      const host = u.hostname.toLowerCase();
      if (host.endsWith("cisa.gov")) {
        score += 10;
        reasons.push("source_host=cisa.gov (+10)");
      }
    }
  } catch {
    // ignore
  }

  return { score, reasons };
}

type GeoPoint = { lat: number; lon: number };

function geoFromMetadata(meta: any): GeoPoint | null {
  const candidates: any[] = [
    meta?.geo,
    meta?.location,
    meta?.raw?.geo,
    meta?.raw?.location,
    meta?.raw,
    meta,
  ];

  for (const g of candidates) {
    if (!g || typeof g !== "object") continue;
    const lat = Number((g as any).lat ?? (g as any).latitude ?? NaN);
    const lon = Number((g as any).lon ?? (g as any).lng ?? (g as any).longitude ?? NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    return { lat, lon };
  }

  return null;
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function scoreFromGeoProximity(
  db: Db,
  tenantId: string,
  evidence: EvidenceRow,
  entityIds: string[],
): Promise<{ score: number; reason: string } | null> {
  const evGeo = geoFromMetadata(evidence.metadata);
  if (!evGeo) return null;
  if (!entityIds.length) return null;

  // Fetch entity metadata for linked entities.
  const rows = await db<{ metadata: any }[]>`
    SELECT metadata
    FROM entities
    WHERE tenant_id = ${tenantId} AND id = ANY(${db.array(entityIds, 2950)})
  `;
  const geos: GeoPoint[] = [];
  for (const r of rows) {
    const g = geoFromMetadata(r.metadata);
    if (g) geos.push(g);
  }
  if (!geos.length) return null;

  let bestKm = Infinity;
  for (const g of geos) {
    const km = haversineKm(evGeo, g);
    if (km < bestKm) bestKm = km;
  }
  if (!Number.isFinite(bestKm)) return null;

  if (bestKm <= 50) return { score: 20, reason: `geo_proximity<=50km (+20)` };
  if (bestKm <= 200) return { score: 10, reason: `geo_proximity<=200km (+10)` };
  return { score: 0, reason: `geo_proximity>200km (+0)` };
}

function severityFromScore(score: number): number {
  const s = clamp(score, 0, 100);
  if (s >= 80) return 5;
  if (s >= 60) return 4;
  if (s >= 40) return 3;
  if (s >= 20) return 2;
  return 1;
}

export async function computeSignalScore(db: Db, tenantId: string, evidence: EvidenceRow, entityIds: string[]) {
  const parts: string[] = [];
  let score = 0;

  const rec = scoreFromRecency(evidence.fetched_at);
  score += rec.score;
  parts.push(rec.reason);

  const src = scoreFromSource(evidence.source_type, evidence.source_uri);
  score += src.score;
  parts.push(...src.reasons);

  const tag = scoreFromTags(evidence.tags ?? []);
  score += tag.score;
  parts.push(...tag.reasons);

  const geo = await scoreFromGeoProximity(db, tenantId, evidence, entityIds);
  if (geo) {
    score += geo.score;
    parts.push(geo.reason);
  }

  if (entityIds.length > 0) {
    const pts = 10;
    score += pts;
    parts.push(`linked_entities=${entityIds.length} (+${pts})`);
  }

  score = clamp(score, 0, 100);
  const severity = severityFromScore(score);

  return { score, severity, reasons: parts };
}

type GeofenceRow = {
  id: string;
  name: string;
  kind: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  entity_id: string | null;
  tags: string[];
  metadata: any;
};

function scoreFromFacilityReputationTags(tags: string[]): { score: number; reasons: string[] } {
  const t = new Set(tags.map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  let score = 0;
  const reasons: string[] = [];

  const add = (pts: number, reason: string) => {
    score += pts;
    reasons.push(`${reason} (+${pts})`);
  };

  // Facility security tags (examples; tune per tenant).
  if (t.has("protest") || t.has("demonstration")) add(20, "tag=protest");
  if (t.has("violence") || t.has("assault")) add(25, "tag=violence");
  if (t.has("shooting")) add(35, "tag=shooting");
  if (t.has("arson") || t.has("fire")) add(25, "tag=arson");
  if (t.has("bomb_threat") || t.has("bomb")) add(40, "tag=bomb_threat");
  if (t.has("strike") || t.has("union")) add(15, "tag=strike_or_union");
  if (t.has("disruption") || t.has("closure")) add(15, "tag=disruption");

  // Reputation tags (examples; tune per tenant).
  if (t.has("reputation") || t.has("negative_media")) add(15, "tag=reputation");
  if (t.has("activism") || t.has("boycott")) add(20, "tag=activism_or_boycott");
  if (t.has("regulatory") || t.has("investigation")) add(15, "tag=regulatory");

  return { score, reasons };
}

function scoreFromDistanceKm(distanceKm: number): { score: number; reason: string } {
  if (!Number.isFinite(distanceKm)) return { score: 0, reason: "distance=unknown (+0)" };
  if (distanceKm <= 1) return { score: 45, reason: "distance<=1km (+45)" };
  if (distanceKm <= 5) return { score: 30, reason: "distance<=5km (+30)" };
  if (distanceKm <= 10) return { score: 20, reason: "distance<=10km (+20)" };
  if (distanceKm <= 25) return { score: 10, reason: "distance<=25km (+10)" };
  return { score: 0, reason: "distance>25km (+0)" };
}

async function alreadyHasSignalKind(db: Db, tenantId: string, evidenceId: string, kind: string): Promise<boolean> {
  const rows = await db<{ ok: number }[]>`
    SELECT 1 as ok
    FROM signal_evidence_links l
    JOIN signals s ON s.id = l.signal_id
    WHERE l.tenant_id = ${tenantId} AND l.evidence_id = ${evidenceId} AND s.kind = ${kind}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function evaluateSignal(db: Db, payload: EvaluateSignalJobPayload): Promise<CreatedSignal[]> {
  const created: CreatedSignal[] = [];
  // If signals tables aren't migrated yet, just no-op.
  try {
    const evidenceRows = await db<EvidenceRow[]>`
      SELECT id, fetched_at, source_type, source_uri, title, summary, tags, metadata
      FROM evidence_items
      WHERE tenant_id = ${payload.tenantId} AND id = ${payload.evidenceId}
      LIMIT 1
    `;
    if (!evidenceRows.length) return created;
    const evidence = evidenceRows[0]!;

    const entityIdsRows = await db<{ entity_id: string }[]>`
      SELECT entity_id
      FROM evidence_entity_links
      WHERE tenant_id = ${payload.tenantId} AND evidence_id = ${payload.evidenceId}
    `;
    const entityIds = entityIdsRows.map((r) => r.entity_id);

    // 1) OSINT rule signal (idempotent per evidence for this kind)
    const hasOsintRule = await alreadyHasSignalKind(db, payload.tenantId, payload.evidenceId, "osint_rule");
    if (!hasOsintRule) {
      const { score, severity, reasons } = await computeSignalScore(db, payload.tenantId, evidence, entityIds);

      // MVP threshold: create signals only for meaningful scores.
      if (score >= 20) {
        const signalId = randomUUID();
        const title = evidence.title ?? evidence.summary?.slice(0, 140) ?? `Signal from evidence ${evidence.id}`;

        await db.begin(async (tx) => {
          await tx`
            INSERT INTO signals (
              id, tenant_id, kind, title, severity, score, status, rationale
            ) VALUES (
              ${signalId},
              ${payload.tenantId},
              ${"osint_rule"},
              ${title},
              ${severity},
              ${score},
              ${"open"},
              ${tx.json({ reasons })}
            )
          `;

          await tx`
            INSERT INTO signal_evidence_links (id, tenant_id, signal_id, evidence_id)
            VALUES (${randomUUID()}, ${payload.tenantId}, ${signalId}, ${payload.evidenceId})
          `;

          for (const row of entityIds) {
            await tx`
              INSERT INTO signal_entity_links (id, tenant_id, signal_id, entity_id)
              VALUES (${randomUUID()}, ${payload.tenantId}, ${signalId}, ${row.entity_id})
              ON CONFLICT DO NOTHING
            `;
          }

          await tx`
            INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
            VALUES (
              ${randomUUID()},
              ${payload.tenantId},
              ${"signal.created"},
              ${null},
              ${"signal"},
              ${signalId},
              ${tx.json({ evidenceId: payload.evidenceId, kind: "osint_rule", score, severity, reasons })}
            )
          `;
        });

        created.push({ id: signalId, kind: "osint_rule", severity, score });
      }
    }

    // 2) Facility geofence signals (many-per-evidence, idempotent via geofence_matches)
    const evGeo = geoFromMetadata(evidence.metadata);
    if (evGeo) {
      let geofences: GeofenceRow[] = [];
      try {
        geofences = await db<GeofenceRow[]>`
          SELECT id, name, kind, center_lat, center_lon, radius_km, entity_id, tags, metadata
          FROM geofences
          WHERE tenant_id = ${payload.tenantId} AND enabled = true
          ORDER BY created_at DESC
          LIMIT 1000
        `;
      } catch (err) {
        const msg = String((err as any)?.message ?? err);
        if (!(msg.includes("relation") && msg.includes("geofences"))) throw err;
      }

      const evidenceTags = evidence.tags ?? [];

      const matches = geofences
        .map((g) => {
          const distKm = haversineKm(evGeo, { lat: Number(g.center_lat), lon: Number(g.center_lon) });
          return { geofence: g, distanceKm: distKm };
        })
        .filter((m) => Number.isFinite(m.distanceKm) && m.distanceKm <= Number(m.geofence.radius_km));

      if (matches.length) {
        await db.begin(async (tx) => {
          for (const m of matches) {
            const g = m.geofence;
            const distanceKm = m.distanceKm;

            // Idempotency: only one match per (tenant, geofence, evidence).
            const matchId = randomUUID();
            let inserted = false;
            try {
              const rows = await tx<{ id: string }[]>`
                INSERT INTO geofence_matches (id, tenant_id, geofence_id, evidence_id, distance_km)
                VALUES (${matchId}, ${payload.tenantId}, ${g.id}, ${payload.evidenceId}, ${distanceKm})
                ON CONFLICT (tenant_id, geofence_id, evidence_id) DO NOTHING
                RETURNING id
              `;
              inserted = rows.length > 0;
            } catch (err) {
              const msg = String((err as any)?.message ?? err);
              if (msg.includes("relation") && msg.includes("geofence_matches")) return;
              throw err;
            }
            if (!inserted) continue;

            const distScore = scoreFromDistanceKm(distanceKm);
            const tagScore = scoreFromFacilityReputationTags([...(g.tags ?? []), ...evidenceTags]);
            const src = scoreFromSource(evidence.source_type, evidence.source_uri);

            let score = distScore.score + tagScore.score + src.score;
            score = clamp(score, 0, 100);
            const severity = severityFromScore(score);

            const reasons = [distScore.reason, ...tagScore.reasons, ...src.reasons];

            const signalId = randomUUID();
            const baseTitle = evidence.title ?? evidence.summary?.slice(0, 80) ?? "OSINT event";
            const title = `${g.name}: ${baseTitle}`.slice(0, 180);

            await tx`
              INSERT INTO signals (
                id, tenant_id, kind, title, severity, score, status, rationale, metadata
              ) VALUES (
                ${signalId},
                ${payload.tenantId},
                ${"facility_geofence"},
                ${title},
                ${severity},
                ${score},
                ${"open"},
                ${tx.json({ reasons, distanceKm, geofenceId: g.id, geofenceName: g.name })},
                ${tx.json({ geofenceId: g.id, geofenceName: g.name, geofenceKind: g.kind, distanceKm })}
              )
            `;

            await tx`
              INSERT INTO signal_evidence_links (id, tenant_id, signal_id, evidence_id)
              VALUES (${randomUUID()}, ${payload.tenantId}, ${signalId}, ${payload.evidenceId})
            `;

            if (g.entity_id) {
              await tx`
                INSERT INTO signal_entity_links (id, tenant_id, signal_id, entity_id)
                VALUES (${randomUUID()}, ${payload.tenantId}, ${signalId}, ${g.entity_id})
                ON CONFLICT DO NOTHING
              `;
            }

            await tx`
              INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
              VALUES (
                ${randomUUID()},
                ${payload.tenantId},
                ${"signal.created"},
                ${null},
                ${"signal"},
                ${signalId},
                ${tx.json({ evidenceId: payload.evidenceId, kind: "facility_geofence", score, severity, reasons, geofenceId: g.id, distanceKm })}
              )
            `;

            created.push({ id: signalId, kind: "facility_geofence", severity, score });
          }
        });
      }
    }
  } catch (err) {
    const msg = String((err as any)?.message ?? err);
    // If tables are missing, swallow. Otherwise rethrow.
    if (msg.includes("relation") && (msg.includes("signals") || msg.includes("signal_evidence_links"))) return;
    throw err;
  }
  return created;
}


