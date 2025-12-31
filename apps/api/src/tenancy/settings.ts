import { randomUUID } from "node:crypto";

import type { Db } from "../db.js";
import { writeAudit } from "../audit.js";

export type IngestPrefs = {
  rssDefaultTags: string[];
  rssAutoTriageStatus: "new" | "triaged";
};

export type DistributionTarget =
  | {
      id: string;
      createdAt: string;
      kind: "email";
      label: string | null;
      value: string;
      enabled: boolean;
    }
  | {
      id: string;
      createdAt: string;
      kind: "teams_webhook";
      label: string | null;
      value: string;
      enabled: boolean;
    };

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export async function listRssFeeds(db: Db, tenantId: string) {
  return await db<
    { id: string; created_at: string; url: string; title: string | null; enabled: boolean }[]
  >`
    SELECT id, created_at, url, title, enabled
    FROM rss_feeds
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `;
}

export async function upsertRssFeed(db: Db, tenantId: string, actorSub: string, input: { url: string; title?: string | null; enabled?: boolean }) {
  const url = input.url.trim();
  if (!url) throw new Error("url is required");
  if (!isValidHttpUrl(url)) throw new Error("url must be http(s)");
  const title = typeof input.title === "string" ? input.title.trim() || null : null;
  const enabled = typeof input.enabled === "boolean" ? input.enabled : true;

  const id = randomUUID();
  const rows = await db<{ id: string; inserted: boolean; enabled: boolean }[]>`
    INSERT INTO rss_feeds (id, tenant_id, url, title, enabled)
    VALUES (${id}, ${tenantId}, ${url}, ${title}, ${enabled})
    ON CONFLICT (tenant_id, url)
    DO UPDATE SET
      enabled = EXCLUDED.enabled,
      title = COALESCE(EXCLUDED.title, rss_feeds.title)
    RETURNING id, (xmax = 0) as inserted, enabled
  `;
  const saved = rows[0]!;
  await writeAudit(db, tenantId, "rss_feed.upserted", actorSub, "rss_feed", saved.id, { url, inserted: saved.inserted, enabled: saved.enabled });
  return { id: saved.id, inserted: saved.inserted, enabled: saved.enabled };
}

export async function setRssFeedEnabled(db: Db, tenantId: string, actorSub: string, url: string, enabled: boolean) {
  const u = url.trim();
  if (!u) throw new Error("url is required");
  const rows = await db<{ id: string }[]>`SELECT id FROM rss_feeds WHERE tenant_id = ${tenantId} AND url = ${u}`;
  if (!rows.length) throw new Error("feed not found");
  await db`UPDATE rss_feeds SET enabled = ${enabled} WHERE tenant_id = ${tenantId} AND url = ${u}`;
  await writeAudit(db, tenantId, "rss_feed.updated", actorSub, "rss_feed", rows[0]!.id, { enabled });
  return { ok: true };
}

export async function deleteRssFeed(db: Db, tenantId: string, actorSub: string, url: string) {
  const u = url.trim();
  if (!u) throw new Error("url is required");
  const deleted = await db<{ id: string }[]>`
    DELETE FROM rss_feeds WHERE tenant_id = ${tenantId} AND url = ${u} RETURNING id
  `;
  if (!deleted.length) throw new Error("feed not found");
  await writeAudit(db, tenantId, "rss_feed.deleted", actorSub, "rss_feed", deleted[0]!.id);
  return { ok: true };
}

export async function getIngestPrefs(db: Db, tenantId: string): Promise<IngestPrefs> {
  const rows = await db<{ rss_default_tags: string[]; rss_auto_triage_status: string }[]>`
    SELECT rss_default_tags, rss_auto_triage_status
    FROM ingest_prefs
    WHERE tenant_id = ${tenantId}
    LIMIT 1
  `;
  const r = rows[0];
  const status = r?.rss_auto_triage_status === "triaged" ? "triaged" : "new";
  return { rssDefaultTags: r?.rss_default_tags ?? [], rssAutoTriageStatus: status };
}

export async function setIngestPrefs(
  db: Db,
  tenantId: string,
  actorSub: string,
  patch: Partial<IngestPrefs>,
) {
  const rssDefaultTags = patch.rssDefaultTags
    ? Array.from(new Set(patch.rssDefaultTags.map(String).map((t) => t.trim()).filter(Boolean)))
    : undefined;
  const rssAutoTriageStatus =
    patch.rssAutoTriageStatus === "new" || patch.rssAutoTriageStatus === "triaged"
      ? patch.rssAutoTriageStatus
      : undefined;

  if (rssDefaultTags === undefined && rssAutoTriageStatus === undefined) throw new Error("No fields provided");

  await db`
    INSERT INTO ingest_prefs (tenant_id, rss_default_tags, rss_auto_triage_status)
    VALUES (
      ${tenantId},
      ${rssDefaultTags ? db.array(rssDefaultTags, 1009) : db.array([], 1009)},
      ${rssAutoTriageStatus ?? "new"}
    )
    ON CONFLICT (tenant_id)
    DO UPDATE SET
      rss_default_tags = COALESCE(${rssDefaultTags ? db.array(rssDefaultTags, 1009) : null}, ingest_prefs.rss_default_tags),
      rss_auto_triage_status = COALESCE(${rssAutoTriageStatus as any}, ingest_prefs.rss_auto_triage_status),
      updated_at = NOW()
  `;

  await writeAudit(db, tenantId, "ingest_prefs.updated", actorSub, "ingest_prefs", tenantId, { rssDefaultTags, rssAutoTriageStatus });
  return { ok: true };
}

export async function listDistributionTargets(db: Db, tenantId: string): Promise<DistributionTarget[]> {
  const rows = await db<
    { id: string; created_at: string; kind: string; label: string | null; value: string; enabled: boolean }[]
  >`
    SELECT id, created_at, kind, label, value, enabled
    FROM distribution_targets
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `;

  const out: DistributionTarget[] = [];
  for (const r of rows) {
    if (r.kind === "email") out.push({ id: r.id, createdAt: r.created_at, kind: "email", label: r.label, value: r.value, enabled: r.enabled });
    if (r.kind === "teams_webhook") out.push({ id: r.id, createdAt: r.created_at, kind: "teams_webhook", label: r.label, value: r.value, enabled: r.enabled });
  }
  return out;
}

export async function upsertEmailTarget(
  db: Db,
  tenantId: string,
  actorSub: string,
  input: { email: string; label?: string | null; enabled?: boolean },
) {
  const email = input.email.trim();
  if (!email) throw new Error("email is required");
  if (!isValidEmail(email)) throw new Error("invalid email");
  const label = typeof input.label === "string" ? input.label.trim() || null : null;
  const enabled = typeof input.enabled === "boolean" ? input.enabled : true;

  const id = randomUUID();
  const rows = await db<{ id: string; inserted: boolean }[]>`
    INSERT INTO distribution_targets (id, tenant_id, kind, label, value, enabled)
    VALUES (${id}, ${tenantId}, ${"email"}, ${label}, ${email}, ${enabled})
    ON CONFLICT (tenant_id, kind, value)
    DO UPDATE SET
      enabled = EXCLUDED.enabled,
      label = COALESCE(EXCLUDED.label, distribution_targets.label),
      updated_at = NOW()
    RETURNING id, (xmax = 0) as inserted
  `;
  const saved = rows[0]!;
  await writeAudit(db, tenantId, "distribution_target.email.upserted", actorSub, "distribution_target", saved.id, { email, enabled, label });
  return { id: saved.id, inserted: saved.inserted };
}

export async function deleteEmailTarget(db: Db, tenantId: string, actorSub: string, email: string) {
  const e = email.trim();
  if (!e) throw new Error("email is required");
  const deleted = await db<{ id: string }[]>`
    DELETE FROM distribution_targets
    WHERE tenant_id = ${tenantId} AND kind = ${"email"} AND value = ${e}
    RETURNING id
  `;
  if (!deleted.length) throw new Error("not found");
  await writeAudit(db, tenantId, "distribution_target.email.deleted", actorSub, "distribution_target", deleted[0]!.id, { email: e });
  return { ok: true };
}

export async function setTeamsWebhook(
  db: Db,
  tenantId: string,
  actorSub: string,
  input: { url: string; enabled?: boolean },
) {
  const url = input.url.trim();
  const enabled = typeof input.enabled === "boolean" ? input.enabled : true;

  if (!url) {
    const deleted = await db<{ id: string }[]>`
      DELETE FROM distribution_targets
      WHERE tenant_id = ${tenantId} AND kind = ${"teams_webhook"}
      RETURNING id
    `;
    for (const row of deleted) {
      await writeAudit(db, tenantId, "distribution_target.teams_webhook.cleared", actorSub, "distribution_target", row.id);
    }
    return { cleared: true };
  }

  if (!isValidHttpUrl(url)) throw new Error("url must be http(s)");

  const id = randomUUID();
  const rows = await db<{ id: string; inserted: boolean }[]>`
    INSERT INTO distribution_targets (id, tenant_id, kind, label, value, enabled)
    VALUES (${id}, ${tenantId}, ${"teams_webhook"}, ${"Teams"}, ${url}, ${enabled})
    ON CONFLICT (tenant_id, kind)
    DO UPDATE SET
      value = EXCLUDED.value,
      enabled = EXCLUDED.enabled,
      updated_at = NOW()
    RETURNING id, (xmax = 0) as inserted
  `;
  const saved = rows[0]!;
  await writeAudit(db, tenantId, "distribution_target.teams_webhook.set", actorSub, "distribution_target", saved.id, { url, enabled });
  return { id: saved.id, inserted: saved.inserted };
}


