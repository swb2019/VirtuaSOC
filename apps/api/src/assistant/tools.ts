import type { Db } from "../db.js";
import type { AssistantToolSpec } from "../ai/assistantAgent.js";
import {
  deleteEmailTarget,
  deleteRssFeed,
  getIngestPrefs,
  listDistributionTargets,
  listRssFeeds,
  setIngestPrefs,
  setRssFeedEnabled,
  setTeamsWebhook,
  upsertEmailTarget,
  upsertRssFeed,
} from "../tenancy/settings.js";

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
        const rows = await listRssFeeds(db, tenantId);
        return {
          ok: true,
          feeds: rows.map((r) => ({ id: r.id, createdAt: r.created_at, url: r.url, title: r.title, enabled: r.enabled })),
        };
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
        try {
          const url = String(a.url ?? "");
          const title = typeof a.title === "string" ? a.title : null;
          const enabled = typeof a.enabled === "boolean" ? a.enabled : undefined;
          const saved = await upsertRssFeed(db, tenantId, actorSub, { url, title: title ?? undefined, enabled });
          return { ok: true, ...saved };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
        }
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
        try {
          const url = String(a.url ?? "");
          const enabled = Boolean(a.enabled);
          await setRssFeedEnabled(db, tenantId, actorSub, url, enabled);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
        }
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
        try {
          const url = String(a.url ?? "");
          await deleteRssFeed(db, tenantId, actorSub, url);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
        }
      },
    },

    // Ingest defaults (requires ingest_prefs table; if missing, tools return a friendly error).
    {
      name: "get_ingest_prefs",
      description: "Get tenant ingest defaults for RSS evidence (default tags and auto-triage status).",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      run: async () => {
        try {
          const prefs = await getIngestPrefs(db, tenantId);
          return { ok: true, ...prefs };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
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
        try {
          const patch: any = {};
          if (Array.isArray(a.rssDefaultTags)) patch.rssDefaultTags = a.rssDefaultTags.map(String);
          if (a.rssAutoTriageStatus === "new" || a.rssAutoTriageStatus === "triaged") {
            patch.rssAutoTriageStatus = a.rssAutoTriageStatus;
          }
          await setIngestPrefs(db, tenantId, actorSub, patch);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
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
          const targets = await listDistributionTargets(db, tenantId);
          return { ok: true, targets };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
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
        try {
          const email = String(a.email ?? "");
          const label = typeof a.label === "string" ? a.label : null;
          const enabled = typeof a.enabled === "boolean" ? a.enabled : undefined;
          const saved = await upsertEmailTarget(db, tenantId, actorSub, { email, label: label ?? undefined, enabled });
          return { ok: true, ...saved };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
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
        try {
          const email = String(a.email ?? "");
          await deleteEmailTarget(db, tenantId, actorSub, email);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
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
        try {
          const url = String(a.url ?? "");
          const enabled = typeof a.enabled === "boolean" ? a.enabled : undefined;
          const res = await setTeamsWebhook(db, tenantId, actorSub, { url, enabled });
          return { ok: true, ...res };
        } catch (err) {
          return { ok: false, error: String((err as any)?.message ?? err) };
        }
      },
    },
  ];

  return tools;
}


