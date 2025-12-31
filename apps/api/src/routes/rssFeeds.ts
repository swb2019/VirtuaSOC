import { randomUUID } from "node:crypto";

import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../auth/guards.js";
import { writeAudit } from "../audit.js";

type RssFeedRow = {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
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

export const rssFeedsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/rss-feeds", async (req) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;

    const rows = await db<RssFeedRow[]>`
      SELECT id, created_at, url, title, enabled
      FROM rss_feeds
      WHERE tenant_id = ${tenant.id}
      ORDER BY created_at DESC
    `;

    return { feeds: rows.map((r) => ({ id: r.id, createdAt: r.created_at, url: r.url, title: r.title, enabled: r.enabled })) };
  });

  app.post<{ Body: { url: string; title?: string } }>("/rss-feeds", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const url = String(req.body?.url ?? "").trim();
    if (!url) return reply.code(400).send({ error: "url is required" });
    if (!isValidHttpUrl(url)) return reply.code(400).send({ error: "url must be http(s)" });

    const title = typeof req.body?.title === "string" ? req.body.title.trim() || null : null;
    const id = randomUUID();

    const rows = await db<{ id: string; inserted: boolean }[]>`
      INSERT INTO rss_feeds (id, tenant_id, url, title, enabled)
      VALUES (${id}, ${tenant.id}, ${url}, ${title}, ${true})
      ON CONFLICT (tenant_id, url)
      DO UPDATE SET
        enabled = true,
        title = COALESCE(EXCLUDED.title, rss_feeds.title)
      RETURNING id, (xmax = 0) as inserted
    `;
    const saved = rows[0]!;

    await writeAudit(db, tenant.id, "rss_feed.upserted", actor.sub, "rss_feed", saved.id, {
      url,
      inserted: saved.inserted,
    });

    return reply.code(saved.inserted ? 201 : 200).send({ id: saved.id, inserted: saved.inserted });
  });

  app.put<{ Params: { id: string }; Body: { enabled?: boolean; title?: string } }>("/rss-feeds/:id", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const id = String(req.params.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "id is required" });

    const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : undefined;

    const exists = await db<{ ok: number }[]>`
      SELECT 1 as ok FROM rss_feeds WHERE tenant_id = ${tenant.id} AND id = ${id}
    `;
    if (!exists.length) return reply.code(404).send({ error: "Not found" });

    await db`
      UPDATE rss_feeds
      SET enabled = COALESCE(${enabled as any}, enabled),
          title = COALESCE(${title as any}, title)
      WHERE tenant_id = ${tenant.id} AND id = ${id}
    `;

    await writeAudit(db, tenant.id, "rss_feed.updated", actor.sub, "rss_feed", id, { enabled, title });

    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>("/rss-feeds/:id", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const id = String(req.params.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "id is required" });

    const deleted = await db<{ id: string }[]>`
      DELETE FROM rss_feeds
      WHERE tenant_id = ${tenant.id} AND id = ${id}
      RETURNING id
    `;
    if (!deleted.length) return reply.code(404).send({ error: "Not found" });

    await writeAudit(db, tenant.id, "rss_feed.deleted", actor.sub, "rss_feed", id);
    return { ok: true };
  });
};


