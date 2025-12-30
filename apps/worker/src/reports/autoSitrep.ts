import { randomUUID } from "node:crypto";

import type { Db } from "../db.js";

import { createDraftFromDefinition, loadReportDefinitions, renderReportMarkdown } from "@virtuasoc/reporting";

export type AutoSitrepJobPayload = {
  tenantId: string;
};

type EvidenceRow = {
  id: string;
  title: string | null;
  summary: string | null;
  source_uri: string | null;
  created_at: string;
};

export async function runAutoSitrep(db: Db, payload: AutoSitrepJobPayload) {
  // Don’t generate duplicates for the same tenant+day.
  const existing = await db<{ ok: number }[]>`
    SELECT 1 as ok
    FROM reports
    WHERE tenant_id = ${payload.tenantId}
      AND definition_id = ${"sitrep"}
      AND created_at::date = CURRENT_DATE
    LIMIT 1
  `;
  if (existing.length) return;

  const evidence = await db<EvidenceRow[]>`
    SELECT id, title, summary, source_uri, created_at
    FROM evidence_items
    WHERE tenant_id = ${payload.tenantId}
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 25
  `;
  if (!evidence.length) return;

  const defs = await loadReportDefinitions({ dir: process.env.REPORT_DEFINITIONS_DIR });
  const def = defs.find((d) => d.id === "sitrep");
  if (!def) throw new Error("SITREP definition missing");

  const day = new Date().toISOString().slice(0, 10);
  const draft = createDraftFromDefinition(def, `Daily SITREP — ${day}`);

  const top = evidence.slice(0, 5);
  const execSummary = top.map((e) => `- ${e.title ?? e.id}`).join("\n");
  const keyDev = evidence
    .map((e) => {
      const title = e.title ?? e.id;
      const summary = e.summary?.trim() ? `\n  - ${e.summary.trim().slice(0, 240)}` : "";
      const src = e.source_uri ? `\n  - Source: ${e.source_uri}` : "";
      return `- ${title}${summary}${src}`;
    })
    .join("\n");

  for (const s of draft.sections) {
    if (s.id === "executive_summary") s.contentMarkdown = execSummary || "_(no items)_";
    if (s.id === "key_developments") s.contentMarkdown = keyDev || "_(no items)_";
    if (s.id === "recommended_actions")
      s.contentMarkdown =
        "- Validate key developments for relevance to your assets/people.\n- Escalate items requiring immediate action.\n- Update leadership with impacts and mitigations.";
  }

  const evidenceIds = evidence.map((e) => e.id);
  draft.evidenceIds = evidenceIds;
  draft.sections.forEach((s) => (s.evidenceIds = evidenceIds));

  const markdown = renderReportMarkdown(
    draft,
    evidence.map((e) => ({ id: e.id, title: e.title, sourceUri: e.source_uri })),
  );

  const reportId = randomUUID();
  await db.begin(async (tx) => {
    await tx`
      INSERT INTO reports (
        id, tenant_id, definition_id, title, status, handling, full_markdown, evidence_ids
      ) VALUES (
        ${reportId},
        ${payload.tenantId},
        ${draft.definitionId},
        ${draft.title},
        ${"draft"},
        ${"internal"},
        ${markdown},
        ${tx.array(evidenceIds, 2950)}
      )
    `;

    for (const s of draft.sections) {
      await tx`
        INSERT INTO report_sections (report_id, id, title, content_markdown, evidence_ids)
        VALUES (
          ${reportId},
          ${s.id},
          ${s.title},
          ${s.contentMarkdown},
          ${tx.array(evidenceIds, 2950)}
        )
      `;
    }

    await tx`
      INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
      VALUES (
        ${randomUUID()},
        ${payload.tenantId},
        ${"report.auto_sitrep.created"},
        ${null},
        ${"report"},
        ${reportId},
        ${tx.json({ definitionId: draft.definitionId, evidenceCount: evidence.length })}
      )
    `;
  });
}



