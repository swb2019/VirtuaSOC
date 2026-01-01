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

export async function ingestRssFeed(db: Db, payload: IngestRssJobPayload) {
  const parser = new Parser();
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

  for (const item of feed.items ?? []) {
    const link = item.link ?? item.guid ?? undefined;
    const title = item.title ?? undefined;
    const content = (item.contentSnippet ?? item.content ?? item.summary ?? "").toString();
    const summary = content.slice(0, 4000);
    const fetchedAt = now;

    const text = `${title ?? ""}\n\n${content}`;
    const hash = contentHash(text);

    // Dedup by (tenant_id, source_uri) unique index
    if (link) {
      try {
        await db`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, tags, triage_status
          ) VALUES (
            ${randomUUID()},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${link},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(defaultTags, 1009)},
            ${autoTriage}
          )
          ON CONFLICT (tenant_id, source_uri) DO NOTHING
        `;
      } catch (err) {
        // Backwards compatibility: tenant DB may not have triage_status yet.
        const msg = String((err as any)?.message ?? err);
        if (!msg.includes("triage_status")) throw err;
        await db`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, tags
          ) VALUES (
            ${randomUUID()},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${link},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(defaultTags, 1009)}
          )
          ON CONFLICT (tenant_id, source_uri) DO NOTHING
        `;
      }
    } else {
      try {
        await db`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, title, summary, content_text, content_hash, tags, triage_status
          ) VALUES (
            ${randomUUID()},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(defaultTags, 1009)},
            ${autoTriage}
          )
        `;
      } catch (err) {
        const msg = String((err as any)?.message ?? err);
        if (!msg.includes("triage_status")) throw err;
        await db`
          INSERT INTO evidence_items (
            id, tenant_id, fetched_at, source_type, title, summary, content_text, content_hash, tags
          ) VALUES (
            ${randomUUID()},
            ${payload.tenantId},
            ${fetchedAt},
            ${"rss"},
            ${title},
            ${summary},
            ${content},
            ${hash},
            ${db.array(defaultTags, 1009)}
          )
        `;
      }
    }
  }
}
