import { randomUUID } from "node:crypto";

import type { FastifyPluginAsync } from "fastify";
import { Queue } from "bullmq";

import { createDraftFromDefinition, loadReportDefinitions, renderReportMarkdown } from "@virtuasoc/reporting";

import { requireRole } from "../auth/guards.js";
import { writeAudit } from "../audit.js";

type ReportRow = {
  id: string;
  created_at: string;
  updated_at: string;
  definition_id: string;
  title: string;
  status: string;
  handling: string;
  severity: string | null;
  period_start: string | null;
  period_end: string | null;
  full_markdown: string | null;
  evidence_ids: string[];
  created_by_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
};

type ReportSectionRow = {
  id: string;
  title: string;
  content_markdown: string;
  evidence_ids: string[];
};

type DistributionRow = {
  id: string;
  created_at: string;
  channel: string;
  target: string;
  status: string;
  sent_at: string | null;
  error: string | null;
};

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  const defs = await loadReportDefinitions({ dir: process.env.REPORT_DEFINITIONS_DIR });

  const distQueue = app.config.redisUrl ? new Queue("ingest", { connection: { url: app.config.redisUrl } }) : null;

  app.get("/reports", async (req) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;

    const limit = Math.min(200, Math.max(1, Number((req.query as any)?.limit ?? "50") || 50));

    const rows = await db<ReportRow[]>`
      SELECT id, created_at, updated_at, definition_id, title, status, handling, severity, period_start, period_end,
             full_markdown, evidence_ids, created_by_user_id, approved_by_user_id, approved_at
      FROM reports
      WHERE tenant_id = ${tenant.id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return { reports: rows };
  });

  app.post<{ Body: { definitionId: string; title?: string } }>("/reports", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const def = defs.find((d) => d.id === req.body.definitionId);
    if (!def) return reply.code(400).send({ error: "Unknown definitionId" });

    const evidenceIds = Array.isArray((req.body as any)?.evidenceIds)
      ? Array.from(
          new Set(
            ((req.body as any).evidenceIds as any[]).map(String).map((s) => s.trim()).filter(Boolean),
          ),
        )
      : [];

    if (evidenceIds.length) {
      const found = await db<{ id: string }[]>`
        SELECT id
        FROM evidence_items
        WHERE tenant_id = ${tenant.id} AND id = ANY(${db.array(evidenceIds, 2950)})
      `;
      if (found.length !== evidenceIds.length) {
        return reply.code(400).send({ error: "One or more evidenceIds are invalid for this tenant" });
      }
    }

    const reportId = randomUUID();
    const now = new Date().toISOString();
    const draft = createDraftFromDefinition(def, req.body.title);

    await db.begin(async (tx) => {
      await tx`
        INSERT INTO reports (
          id, tenant_id, created_at, updated_at, definition_id, title, status, handling, evidence_ids, created_by_user_id
        ) VALUES (
          ${reportId},
          ${tenant.id},
          ${now},
          ${now},
          ${draft.definitionId},
          ${draft.title},
          ${"draft"},
          ${"internal"},
          ${evidenceIds.length ? tx.array(evidenceIds, 2950) : tx.array([], 2950)},
          ${actor.sub}
        )
      `;

      for (const s of draft.sections) {
        await tx`
          INSERT INTO report_sections (report_id, id, title, content_markdown, evidence_ids)
          VALUES (${reportId}, ${s.id}, ${s.title}, ${s.contentMarkdown}, ${tx.array([], 2950)})
        `;
      }
    });

    await writeAudit(db, tenant.id, "report.created", actor.sub, "report", reportId, {
      definitionId: draft.definitionId,
      evidenceCount: evidenceIds.length,
    });

    return reply.code(201).send({ id: reportId });
  });

  app.get<{ Params: { id: string } }>("/reports/:id", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;

    const rows = await db<ReportRow[]>`
      SELECT id, created_at, updated_at, definition_id, title, status, handling, severity, period_start, period_end,
             full_markdown, evidence_ids, created_by_user_id, approved_by_user_id, approved_at
      FROM reports
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
    `;
    if (!rows.length) return reply.code(404).send({ error: "Not found" });
    const report = rows[0]!;

    const sections = await db<ReportSectionRow[]>`
      SELECT id, title, content_markdown, evidence_ids
      FROM report_sections
      WHERE report_id = ${report.id}
      ORDER BY id ASC
    `;

    return { report, sections };
  });

  app.put<{
    Params: { id: string; sectionId: string };
    Body: { contentMarkdown?: string; evidenceIds?: string[] };
  }>("/reports/:id/sections/:sectionId", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const exists = await db<{ ok: number }[]>`
      SELECT 1 as ok FROM reports WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
    `;
    if (!exists.length) return reply.code(404).send({ error: "Not found" });

    const evidenceIds = Array.isArray(req.body.evidenceIds) ? req.body.evidenceIds.map(String) : undefined;
    const contentMarkdown = typeof req.body.contentMarkdown === "string" ? req.body.contentMarkdown : undefined;

    await db.begin(async (tx) => {
      await tx`
        UPDATE report_sections
        SET content_markdown = COALESCE(${contentMarkdown as any}, content_markdown),
            evidence_ids = COALESCE(${evidenceIds ? tx.array(evidenceIds, 2950) : null}, evidence_ids)
        WHERE report_id = ${req.params.id} AND id = ${req.params.sectionId}
      `;
      await tx`
        UPDATE reports SET updated_at = NOW()
        WHERE id = ${req.params.id}
      `;
    });

    await writeAudit(db, tenant.id, "report.section.updated", actor.sub, "report", req.params.id, {
      sectionId: req.params.sectionId,
    });

    return { ok: true };
  });

  app.post<{ Params: { id: string } }>("/reports/:id/submit", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const updated = await db<{ id: string }[]>`
      UPDATE reports
      SET status = ${"in_review"}, updated_at = NOW()
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id} AND status = ${"draft"}
      RETURNING id
    `;
    if (!updated.length) {
      const rows = await db<{ status: string }[]>`
        SELECT status FROM reports WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
      `;
      if (!rows.length) return reply.code(404).send({ error: "Not found" });
      return reply.code(409).send({ error: `Invalid transition: ${rows[0]!.status} -> in_review` });
    }

    await writeAudit(db, tenant.id, "report.submitted", actor.sub, "report", req.params.id);
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>("/reports/:id/approve", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_lead");
    if (!actor) return;

    const updated = await db<{ id: string }[]>`
      UPDATE reports
      SET status = ${"approved"}, approved_by_user_id = ${actor.sub}, approved_at = NOW(), updated_at = NOW()
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id} AND status = ${"in_review"}
      RETURNING id
    `;
    if (!updated.length) {
      const rows = await db<{ status: string }[]>`
        SELECT status FROM reports WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
      `;
      if (!rows.length) return reply.code(404).send({ error: "Not found" });
      return reply.code(409).send({ error: `Invalid transition: ${rows[0]!.status} -> approved` });
    }

    await writeAudit(db, tenant.id, "report.approved", actor.sub, "report", req.params.id);
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>("/reports/:id/render", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const reportRows = await db<ReportRow[]>`
      SELECT id, created_at, updated_at, definition_id, title, status, handling, severity, period_start, period_end,
             full_markdown, evidence_ids, created_by_user_id, approved_by_user_id, approved_at
      FROM reports
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
    `;
    if (!reportRows.length) return reply.code(404).send({ error: "Not found" });
    const report = reportRows[0]!;

    const sectionRows = await db<ReportSectionRow[]>`
      SELECT id, title, content_markdown, evidence_ids
      FROM report_sections
      WHERE report_id = ${report.id}
      ORDER BY id ASC
    `;

    // union of all evidence ids
    const evidenceIdSet = new Set<string>();
    for (const s of sectionRows) for (const eid of s.evidence_ids ?? []) evidenceIdSet.add(eid);
    for (const eid of report.evidence_ids ?? []) evidenceIdSet.add(eid);
    const evidenceIds = Array.from(evidenceIdSet);

    const evidence = evidenceIds.length
      ? await db<{ id: string; title: string | null; source_uri: string | null }[]>`
          SELECT id, title, source_uri
          FROM evidence_items
          WHERE tenant_id = ${tenant.id} AND id = ANY(${db.array(evidenceIds, 2950)})
        `
      : [];

    const draft = {
      definitionId: report.definition_id,
      title: report.title,
      sections: sectionRows.map((s) => ({
        id: s.id,
        title: s.title,
        contentMarkdown: s.content_markdown ?? "",
        evidenceIds: s.evidence_ids ?? [],
      })),
      evidenceIds,
    };

    const markdown = renderReportMarkdown(
      draft,
      evidence.map((e) => ({ id: e.id, title: e.title, sourceUri: e.source_uri })),
    );

    await db`
      UPDATE reports
      SET full_markdown = ${markdown}, updated_at = NOW()
      WHERE tenant_id = ${tenant.id} AND id = ${report.id}
    `;

    await writeAudit(db, tenant.id, "report.rendered", actor.sub, "report", report.id, {
      evidenceCount: evidence.length,
    });

    return { ok: true, markdown };
  });

  app.get<{ Params: { id: string } }>("/reports/:id/distributions", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const rows = await db<DistributionRow[]>`
      SELECT id, created_at, channel, target, status, sent_at, error
      FROM distribution_records
      WHERE tenant_id = ${tenant.id} AND report_id = ${req.params.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return {
      distributions: rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        channel: r.channel,
        target: r.target,
        status: r.status,
        sentAt: r.sent_at,
        error: r.error,
      })),
    };
  });

  app.post<{
    Params: { id: string };
    Body: { channel: "email" | "teams"; target?: string; subject?: string };
  }>("/reports/:id/distribute", async (req, reply) => {
    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_lead");
    if (!actor) return;

    if (!distQueue) return reply.code(501).send({ error: "REDIS_URL not configured" });

    const channel = req.body?.channel;
    if (channel !== "email" && channel !== "teams") {
      return reply.code(400).send({ error: "channel must be email|teams" });
    }

    const reportRows = await db<ReportRow[]>`
      SELECT id, title, status
      FROM reports
      WHERE tenant_id = ${tenant.id} AND id = ${req.params.id}
    `;
    if (!reportRows.length) return reply.code(404).send({ error: "Not found" });
    const report = reportRows[0]!;

    if (app.config.distributionRequireApproval && report.status !== "approved") {
      return reply.code(409).send({ error: "Report must be approved before distribution" });
    }

    const targetRaw = typeof req.body?.target === "string" ? req.body.target.trim() : "";
    if (channel === "email" && !targetRaw) {
      return reply.code(400).send({ error: "target is required for email" });
    }

    const subject =
      (typeof req.body?.subject === "string" ? req.body.subject.trim() : "") || report.title || "VirtuaSOC Report";

    const distributionId = randomUUID();
    const target = channel === "email" ? targetRaw : "teams";

    await db`
      INSERT INTO distribution_records (id, tenant_id, report_id, channel, target, status)
      VALUES (${distributionId}, ${tenant.id}, ${report.id}, ${channel}, ${target}, ${"queued"})
    `;

    await distQueue.add(
      "reports.distribute",
      { tenantId: tenant.id, reportId: report.id, distributionId, channel, target: channel === "email" ? targetRaw : undefined, subject, actorSub: actor.sub },
      { jobId: distributionId, attempts: 3, backoff: { type: "fixed", delay: 60_000 }, removeOnComplete: 100, removeOnFail: 100 },
    );

    await writeAudit(db, tenant.id, "report.distribution.queued", actor.sub, "report", report.id, {
      distributionId,
      channel,
      target,
    });

    return reply.code(202).send({ ok: true, distributionId });
  });
};



