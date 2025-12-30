import { randomUUID } from "node:crypto";

import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../auth/guards.js";
import { writeAudit } from "../audit.js";

type EvidenceRow = {
  id: string;
  created_at: string;
  fetched_at: string;
  source_type: string;
  source_uri: string | null;
  title: string | null;
  summary: string | null;
  content_text: string | null;
  content_hash: string | null;
  handling: string | null;
  tags: string[];
};

export const evidenceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/evidence", async (req) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;

    const q = typeof (req.query as any)?.q === "string" ? String((req.query as any).q) : "";
    const limit = Math.min(
      200,
      Math.max(1, Number((req.query as any)?.limit ?? "50") || 50),
    );

    let rows: EvidenceRow[];
    if (q.trim()) {
      rows = await db<EvidenceRow[]>`
        SELECT id, created_at, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, handling, tags
        FROM evidence_items
        WHERE tenant_id = ${tenant.id}
          AND search_tsv @@ plainto_tsquery('english', ${q})
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await db<EvidenceRow[]>`
        SELECT id, created_at, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, handling, tags
        FROM evidence_items
        WHERE tenant_id = ${tenant.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return { evidence: rows };
  });

  app.get<{ Params: { id: string } }>("/evidence/:id", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;

    const rows = await db<EvidenceRow[]>`
      SELECT id, created_at, fetched_at, source_type, source_uri, title, summary, content_text, content_hash, handling, tags
      FROM evidence_items
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
    `;
    if (!rows.length) return reply.code(404).send({ error: "Not found" });
    return { evidence: rows[0] };
  });

  app.post<{
    Body: {
      sourceType: string;
      sourceUri?: string;
      title?: string;
      summary?: string;
      contentText?: string;
      handling?: string;
      tags?: string[];
    };
  }>("/evidence", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const id = randomUUID();
    const fetchedAt = new Date().toISOString();

    const b = req.body ?? ({} as any);
    const tags = Array.isArray(b.tags) ? b.tags.map(String) : [];

    await db`
      INSERT INTO evidence_items (
        id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, handling, tags
      ) VALUES (
        ${id},
        ${tenant.id},
        ${fetchedAt},
        ${String(b.sourceType ?? "manual_upload")},
        ${b.sourceUri ?? null},
        ${b.title ?? null},
        ${b.summary ?? null},
        ${b.contentText ?? null},
        ${b.handling ?? "internal"},
        ${tags}
      )
    `;

    await writeAudit(db, tenant.id, "evidence.created", actor.sub, "evidence", id, {
      sourceType: b.sourceType,
      sourceUri: b.sourceUri,
    });

    return reply.code(201).send({ id });
  });
};



