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
      await db`
        INSERT INTO evidence_items (
          id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, content_hash
        ) VALUES (
          ${randomUUID()},
          ${payload.tenantId},
          ${fetchedAt},
          ${"rss"},
          ${link},
          ${title},
          ${summary},
          ${content},
          ${hash}
        )
        ON CONFLICT (tenant_id, source_uri) DO NOTHING
      `;
    } else {
      await db`
        INSERT INTO evidence_items (
          id, tenant_id, fetched_at, source_type, title, summary, content_text, content_hash
        ) VALUES (
          ${randomUUID()},
          ${payload.tenantId},
          ${fetchedAt},
          ${"rss"},
          ${title},
          ${summary},
          ${content},
          ${hash}
        )
      `;
    }
  }
}
