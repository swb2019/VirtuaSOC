import { createHash, randomUUID } from "node:crypto";

import Parser from "rss-parser";

import type { Db } from "../db.js";

export type IngestRssJobPayload = {
  tenantId: string;
  feedUrl: string;
};

function contentHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

type Geo = { lat: number; lon: number };

function parseGeoPoint(raw: unknown): Geo | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // GeoRSS point is usually "lat lon" (space-separated). Some feeds use "lat,lon".
  const parts = s.includes(",") ? s.split(",") : s.split(/\s+/);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function normalizeTag(raw: string): string | null {
  const t = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!t) return null;
  return t.slice(0, 40);
}

const ALLOWED_CATEGORY_TAGS = new Set<string>([
  "protest",
  "demonstration",
  "violence",
  "shooting",
  "arson",
  "fire",
  "bomb",
  "bomb_threat",
  "strike",
  "union",
  "disruption",
  "closure",
  "activism",
  "boycott",
  "regulatory",
  "investigation",
  "cargo_theft",
  "theft",
  "hijacking",
  "robbery",
  "road_closure",
  "accident",
  "crash",
  "port",
  "rail",
  "airport",
  "weather",
]);

function tagsFromCategories(categories: unknown): string[] {
  const raw = Array.isArray(categories) ? categories.map(String) : [];
  const mapped = raw
    .map((c) => normalizeTag(c))
    .filter((x): x is string => Boolean(x))
    .map((t) => (t === "demonstrations" ? "demonstration" : t))
    .map((t) => (t === "protests" ? "protest" : t))
    .filter((t) => ALLOWED_CATEGORY_TAGS.has(t));
  return Array.from(new Set(mapped));
}

function geoFromItem(item: any): { geo: Geo; source: string } | null {
  // GeoRSS
  const georss = parseGeoPoint(item?.["georss:point"]);
  if (georss) return { geo: georss, source: "georss:point" };

  // W3C geo
  const lat = Number(item?.["geo:lat"] ?? item?.["geo:latitude"] ?? NaN);
  const lon = Number(item?.["geo:long"] ?? item?.["geo:lon"] ?? item?.["geo:longitude"] ?? NaN);
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    return { geo: { lat, lon }, source: "geo:lat/long" };
  }

  return null;
}

export async function ingestRssFeed(db: Db, payload: IngestRssJobPayload) {
  const parser = new Parser({
    customFields: {
      item: ["georss:point", "geo:lat", "geo:long", "geo:lon"],
    } as any,
  });
  const feed = await parser.parseURL(payload.feedUrl);

  const now = new Date().toISOString();

  // Tenant ingest defaults (optional; table may not exist yet on older tenant DBs).
  let defaultTags: string[] = [];
  let autoTriage: "new" | "triaged" = "new";
  try {
    const rows = await db<{ rss_default_tags: string[]; rss_auto_triage_status: string }[]>`
      SELECT rss_default_tags, rss_auto_triage_status
      FROM ingest_prefs
      WHERE tenant_id = ${payload.tenantId}
      LIMIT 1
    `;
    const r = rows[0];
    defaultTags = r?.rss_default_tags ?? [];
    autoTriage = r?.rss_auto_triage_status === "triaged" ? "triaged" : "new";
  } catch {
    // Ignore (migrations may not be applied yet).
  }

  const insertedEvidenceIds: string[] = [];

  for (const item of feed.items ?? []) {
    const link = item.link ?? item.guid ?? undefined;
    const title = item.title ?? undefined;
    const content = (item.contentSnippet ?? item.content ?? item.summary ?? "").toString();
    const summary = content.slice(0, 4000);
    const fetchedAt = now;

    const text = `${title ?? ""}\n\n${content}`;
    const hash = contentHash(text);

    const geoFound = geoFromItem(item as any);
    const geo = geoFound?.geo ?? null;
    const categoryTags = tagsFromCategories((item as any)?.categories);
    const tags = Array.from(new Set([...(defaultTags ?? []), ...categoryTags]));

    const metadata = {
      ...(geo ? { geo } : {}),
      ...(geoFound?.source ? { geoSource: geoFound.source } : {}),
      rss: {
        feedUrl: payload.feedUrl,
        feedTitle: feed.title ?? null,
        itemGuid: (item as any)?.guid ?? null,
        categories: Array.isArray((item as any)?.categories) ? (item as any).categories : [],
      },
    } as Record<string, unknown>;

    // Dedup by (tenant_id, source_uri) unique index
    if (link) {
      const id = randomUUID();
      try {
        const rows = await db<{ id: string }[]>`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, tags, triage_status, metadata
          ) VALUES (
            ${id},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${link},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(tags, 1009)},
            ${autoTriage}
            ,
            ${db.json(metadata)}
          )
          ON CONFLICT (tenant_id, source_uri) DO NOTHING
          RETURNING id
        `;
        if (rows.length) insertedEvidenceIds.push(id);
      } catch (err) {
        // Backwards compatibility: tenant DB may not have triage_status yet.
        const msg = String((err as any)?.message ?? err);
        // Dedupe by content hash: ignore unique constraint violations.
        if (msg.includes("idx_evidence_unique_content_hash")) continue;
        if (!msg.includes("triage_status")) throw err;
        try {
          const rows = await db<{ id: string }[]>`
            INSERT INTO evidence_items (
              id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, tags, metadata
            ) VALUES (
              ${id},
              ${payload.tenantId},
              ${fetchedAt},
              ${"rss"},
              ${link},
              ${title},
              ${summary},
              ${content},
              ${hash},
              ${db.array(tags, 1009)},
              ${db.json(metadata)}
            )
            ON CONFLICT (tenant_id, source_uri) DO NOTHING
            RETURNING id
          `;
          if (rows.length) insertedEvidenceIds.push(id);
        } catch (err2) {
          const msg2 = String((err2 as any)?.message ?? err2);
          if (msg2.includes("idx_evidence_unique_content_hash")) continue;
          throw err2;
        }
      }
    } else {
      try {
        const id = randomUUID();
        const rows = await db<{ id: string }[]>`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, title, summary, content_text, content_hash, tags, triage_status, metadata
          ) VALUES (
            ${id},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(tags, 1009)},
            ${autoTriage}
            ,
            ${db.json(metadata)}
          )
          RETURNING id
        `;
        if (rows.length) insertedEvidenceIds.push(id);
      } catch (err) {
        const msg = String((err as any)?.message ?? err);
        if (msg.includes("idx_evidence_unique_content_hash")) continue;
        if (!msg.includes("triage_status")) throw err;
        const id = randomUUID();
        try {
          const rows = await db<{ id: string }[]>`
            INSERT INTO evidence_items (
              id, tenant_id, fetched_at, source_type, title, summary, content_text, content_hash, tags, metadata
            ) VALUES (
              ${id},
              ${payload.tenantId},
              ${fetchedAt},
              ${"rss"},
              ${title},
              ${summary},
              ${content},
              ${hash},
              ${db.array(tags, 1009)},
              ${db.json(metadata)}
            )
            RETURNING id
          `;
          if (rows.length) insertedEvidenceIds.push(id);
        } catch (err2) {
          const msg2 = String((err2 as any)?.message ?? err2);
          if (msg2.includes("idx_evidence_unique_content_hash")) continue;
          throw err2;
        }
      }
    }
  }

  return insertedEvidenceIds;
}
