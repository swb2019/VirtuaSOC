import { randomUUID } from "node:crypto";

import type { FastifyPluginAsync } from "fastify";
import { Queue } from "bullmq";

import { requireRole } from "../auth/guards.js";
import { writeAudit } from "../audit.js";

function headerString(req: any, name: string): string | null {
  const v = req.headers?.[name];
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function headerStringCsv(req: any, name: string): string[] {
  const v = headerString(req, name);
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export const ingestWebhookRoutes: FastifyPluginAsync = async (app) => {
  const ingestQueue = app.config.redisUrl ? new Queue("ingest", { connection: { url: app.config.redisUrl } }) : null;

  // Tenant-scoped webhook ingestion.
  //
  // Auth: requires a normal VirtuaSOC bearer token (OIDC/local), same as other tenant routes.
  // Idempotency: if sourceUri is provided, we upsert by (tenant_id, source_uri).
  app.post("/ingest/webhook", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    // Accept any JSON payload. Optional hints can be provided via headers or common body keys.
    const body = (req.body ?? null) as unknown;
    const b = (body && typeof body === "object" ? (body as any) : null) as any;

    const sourceType =
      headerString(req, "x-ingest-source") ??
      (typeof b?.sourceType === "string" ? b.sourceType.trim() : null) ??
      "webhook";

    const sourceUri =
      headerString(req, "x-ingest-source-uri") ??
      (typeof b?.sourceUri === "string" ? b.sourceUri.trim() : null) ??
      (typeof b?.source_uri === "string" ? b.source_uri.trim() : null);

    const title =
      headerString(req, "x-ingest-title") ??
      (typeof b?.title === "string" ? b.title.trim() : null);

    const summary =
      headerString(req, "x-ingest-summary") ??
      (typeof b?.summary === "string" ? b.summary.trim() : null);

    const contentText =
      typeof b?.contentText === "string"
        ? b.contentText
        : typeof b?.content_text === "string"
          ? b.content_text
          : null;

    const handling =
      headerString(req, "x-ingest-handling") ??
      (typeof b?.handling === "string" ? b.handling.trim() : null) ??
      "internal";

    const tagsFromHeaders = headerStringCsv(req, "x-ingest-tags");
    const tagsFromBody = Array.isArray(b?.tags) ? b.tags.map(String) : [];
    const tags = Array.from(new Set<string>([...tagsFromHeaders, ...tagsFromBody].map((t) => t.trim()).filter(Boolean)));

    const fetchedAt = new Date().toISOString();
    const id = randomUUID();

    // Store the raw payload plus a small, safe subset of context.
    const metadata = {
      source: {
        type: sourceType,
        uri: sourceUri ?? null,
      },
      raw: body,
      receivedAt: fetchedAt,
    } as Record<string, unknown>;

    const rows = await db<{ id: string; inserted: boolean }[]>`
      INSERT INTO evidence_items (
        id, tenant_id, fetched_at, source_type, source_uri, title, summary, content_text, handling, tags, metadata
      ) VALUES (
        ${id},
        ${tenant.id},
        ${fetchedAt},
        ${sourceType},
        ${sourceUri ?? null},
        ${title ?? null},
        ${summary ?? null},
        ${contentText ?? null},
        ${handling},
        ${tags},
        ${db.json(metadata)}
      )
      ON CONFLICT (tenant_id, source_uri)
      WHERE source_uri IS NOT NULL
      DO UPDATE SET
        fetched_at = EXCLUDED.fetched_at,
        source_type = EXCLUDED.source_type,
        title = COALESCE(EXCLUDED.title, evidence_items.title),
        summary = COALESCE(EXCLUDED.summary, evidence_items.summary),
        content_text = COALESCE(EXCLUDED.content_text, evidence_items.content_text),
        handling = COALESCE(EXCLUDED.handling, evidence_items.handling),
        tags = (
          SELECT ARRAY(
            SELECT DISTINCT UNNEST(evidence_items.tags || EXCLUDED.tags)
          )
        ),
        metadata = evidence_items.metadata || EXCLUDED.metadata
      RETURNING id, (xmax = 0) as inserted
    `;

    const saved = rows[0]!;

    await writeAudit(db, tenant.id, "evidence.ingested", actor.sub, "evidence", saved.id, {
      channel: "webhook",
      sourceType,
      sourceUri: sourceUri ?? null,
      inserted: saved.inserted,
      tagCount: tags.length,
    });

    // Best-effort: kick off enrichment asynchronously (URL fetch + IOC extraction).
    // If Redis is not configured, enrichment can still be triggered via other paths (factory/manual, RSS, etc.).
    if (ingestQueue) {
      await ingestQueue.add(
        "evidence.enrich",
        { tenantId: tenant.id, evidenceId: saved.id, actorUserId: actor.sub },
        { jobId: `enrich:${tenant.id}:${saved.id}`, removeOnComplete: 1000, removeOnFail: 1000 },
      );
    }

    return reply.code(saved.inserted ? 201 : 200).send({ id: saved.id, inserted: saved.inserted });
  });
};


