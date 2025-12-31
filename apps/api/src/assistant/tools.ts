import { randomUUID } from "node:crypto";

import type { Db } from "../db.js";
import { writeAudit } from "../audit.js";
import type { AssistantToolSpec } from "../ai/assistantAgent.js";

export type SetupAssistantContext = {
  tenantId: string;
  db: Db;
  actorSub: string;
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
  // Intentionally simple (no deps); good enough for basic validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export function buildSetupAssistantTools(ctx: SetupAssistantContext): AssistantToolSpec[] {
  const { tenantId, db, actorSub } = ctx;

  const tools: AssistantToolSpec[] = [
    {
      name: "list_rss_feeds",
      description: "List RSS feeds configured for this tenant.",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      run: async () => {
        const rows = await db<
          { id: string; created_at: string; url: string; title: string | null; enabled: boolean }[]
        >`
          SELECT id, created_at, url, title, enabled
          FROM rss_feeds
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `;
        return { ok: true, feeds: rows.map((r) => ({ id: r.id, createdAt: r.created_at, url: r.url, title: r.title, enabled: r.enabled })) };
      },
    },
    {
      name: "upsert_rss_feed",
      description: "Add or update an RSS feed by URL (idempotent). Enables the feed by default unless enabled=false.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string", description: "RSS/Atom feed URL (http/https)" },
          title: { type: "string", description: "Optional title/label", nullable: true },
          enabled: { type: "boolean", description: "Whether the feed is enabled", nullable: true },
        },
        required: ["url"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const url = String(a.url ?? "").trim();
        if (!url) return { ok: false, error: "url is required" };
        if (!isValidHttpUrl(url)) return { ok: false, error: "url must be http(s)" };

        const title = typeof a.title === "string" ? a.title.trim() || null : null;
        const enabled = typeof a.enabled === "boolean" ? a.enabled : true;
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

        await writeAudit(db, tenantId, "rss_feed.upserted", actorSub, "rss_feed", saved.id, {
          url,
          inserted: saved.inserted,
          enabled: saved.enabled,
        });

        return { ok: true, id: saved.id, inserted: saved.inserted, enabled: saved.enabled };
      },
    },
    {
      name: "set_rss_feed_enabled",
      description: "Enable or disable an RSS feed by URL.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string" },
          enabled: { type: "boolean" },
        },
        required: ["url", "enabled"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const url = String(a.url ?? "").trim();
        const enabled = Boolean(a.enabled);
        if (!url) return { ok: false, error: "url is required" };

        const rows = await db<{ id: string }[]>`
          SELECT id FROM rss_feeds WHERE tenant_id = ${tenantId} AND url = ${url}
        `;
        if (!rows.length) return { ok: false, error: "feed not found" };
        const id = rows[0]!.id;

        await db`
          UPDATE rss_feeds
          SET enabled = ${enabled}
          WHERE tenant_id = ${tenantId} AND url = ${url}
        `;
        await writeAudit(db, tenantId, "rss_feed.updated", actorSub, "rss_feed", id, { enabled });
        return { ok: true };
      },
    },
    {
      name: "delete_rss_feed",
      description: "Delete an RSS feed by URL.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: { url: { type: "string" } },
        required: ["url"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const url = String(a.url ?? "").trim();
        if (!url) return { ok: false, error: "url is required" };
        const deleted = await db<{ id: string }[]>`
          DELETE FROM rss_feeds
          WHERE tenant_id = ${tenantId} AND url = ${url}
          RETURNING id
        `;
        if (!deleted.length) return { ok: false, error: "feed not found" };
        await writeAudit(db, tenantId, "rss_feed.deleted", actorSub, "rss_feed", deleted[0]!.id);
        return { ok: true };
      },
    },

    // Ingest defaults (requires ingest_prefs table; if missing, tools return a friendly error).
    {
      name: "get_ingest_prefs",
      description: "Get tenant ingest defaults for RSS evidence (default tags and auto-triage status).",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      run: async () => {
        try {
          const rows = await db<
            { rss_default_tags: string[]; rss_auto_triage_status: string }[]
          >`
            SELECT rss_default_tags, rss_auto_triage_status
            FROM ingest_prefs
            WHERE tenant_id = ${tenantId}
            LIMIT 1
          `;
          const r = rows[0];
          return {
            ok: true,
            rssDefaultTags: r?.rss_default_tags ?? [],
            rssAutoTriageStatus: (r?.rss_auto_triage_status ?? "new") as string,
          };
        } catch (err) {
          return { ok: false, error: "ingest_prefs not available yet (migrations not applied)" };
        }
      },
    },
    {
      name: "set_ingest_prefs",
      description:
        "Set tenant ingest defaults for RSS evidence. rssAutoTriageStatus must be 'new' or 'triaged'.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          rssDefaultTags: { type: "array", items: { type: "string" }, nullable: true },
          rssAutoTriageStatus: { type: "string", enum: ["new", "triaged"], nullable: true },
        },
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const rssDefaultTags = Array.isArray(a.rssDefaultTags)
          ? Array.from(new Set(a.rssDefaultTags.map(String).map((t: string) => t.trim()).filter(Boolean)))
          : undefined;
        const rssAutoTriageStatus =
          a.rssAutoTriageStatus === "new" || a.rssAutoTriageStatus === "triaged"
            ? (a.rssAutoTriageStatus as string)
            : undefined;

        if (rssDefaultTags === undefined && rssAutoTriageStatus === undefined) {
          return { ok: false, error: "No fields provided" };
        }

        try {
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

          await writeAudit(db, tenantId, "ingest_prefs.updated", actorSub, "ingest_prefs", tenantId, {
            rssDefaultTags,
            rssAutoTriageStatus,
          });

          return { ok: true };
        } catch {
          return { ok: false, error: "ingest_prefs not available yet (migrations not applied)" };
        }
      },
    },

    // Distribution targets (requires distribution_targets table).
    {
      name: "list_distribution_targets",
      description: "List saved distribution targets (email targets and Teams webhook) for this tenant.",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      run: async () => {
        try {
          const rows = await db<
            { id: string; created_at: string; kind: string; label: string | null; value: string; enabled: boolean }[]
          >`
            SELECT id, created_at, kind, label, value, enabled
            FROM distribution_targets
            WHERE tenant_id = ${tenantId}
            ORDER BY created_at DESC
          `;
          return { ok: true, targets: rows.map((r) => ({ id: r.id, createdAt: r.created_at, kind: r.kind, label: r.label, value: r.value, enabled: r.enabled })) };
        } catch {
          return { ok: false, error: "distribution_targets not available yet (migrations not applied)" };
        }
      },
    },
    {
      name: "upsert_email_target",
      description: "Add or update a saved email distribution target for this tenant.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: { type: "string" },
          label: { type: "string", nullable: true },
          enabled: { type: "boolean", nullable: true },
        },
        required: ["email"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const email = String(a.email ?? "").trim();
        if (!email) return { ok: false, error: "email is required" };
        if (!isValidEmail(email)) return { ok: false, error: "invalid email" };
        const label = typeof a.label === "string" ? a.label.trim() || null : null;
        const enabled = typeof a.enabled === "boolean" ? a.enabled : true;

        try {
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
          return { ok: true, id: saved.id, inserted: saved.inserted };
        } catch {
          return { ok: false, error: "distribution_targets not available yet (migrations not applied)" };
        }
      },
    },
    {
      name: "delete_email_target",
      description: "Delete a saved email distribution target by email address.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: { email: { type: "string" } },
        required: ["email"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const email = String(a.email ?? "").trim();
        if (!email) return { ok: false, error: "email is required" };
        try {
          const deleted = await db<{ id: string }[]>`
            DELETE FROM distribution_targets
            WHERE tenant_id = ${tenantId} AND kind = ${"email"} AND value = ${email}
            RETURNING id
          `;
          if (!deleted.length) return { ok: false, error: "not found" };
          await writeAudit(db, tenantId, "distribution_target.email.deleted", actorSub, "distribution_target", deleted[0]!.id, { email });
          return { ok: true };
        } catch {
          return { ok: false, error: "distribution_targets not available yet (migrations not applied)" };
        }
      },
    },
    {
      name: "set_teams_webhook",
      description:
        "Set or clear the per-tenant Teams webhook URL for report distribution. Pass url=\"\" to clear.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: { url: { type: "string" }, enabled: { type: "boolean", nullable: true } },
        required: ["url"],
      },
      run: async (args) => {
        const a = (args ?? {}) as any;
        const url = String(a.url ?? "").trim();
        const enabled = typeof a.enabled === "boolean" ? a.enabled : true;

        try {
          if (!url) {
            const deleted = await db<{ id: string }[]>`
              DELETE FROM distribution_targets
              WHERE tenant_id = ${tenantId} AND kind = ${"teams_webhook"}
              RETURNING id
            `;
            for (const row of deleted) {
              await writeAudit(db, tenantId, "distribution_target.teams_webhook.cleared", actorSub, "distribution_target", row.id);
            }
            return { ok: true, cleared: true };
          }

          if (!isValidHttpUrl(url)) return { ok: false, error: "url must be http(s)" };

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
          return { ok: true, id: saved.id, inserted: saved.inserted };
        } catch {
          return { ok: false, error: "distribution_targets not available yet (migrations not applied)" };
        }
      },
    },
  ];

  return tools;
}


