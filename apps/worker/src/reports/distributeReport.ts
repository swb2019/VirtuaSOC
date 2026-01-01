import { randomUUID } from "node:crypto";

import { sendEmail, type SmtpConfig } from "@virtuasoc/integration-email";
import { sendTeamsWebhook } from "@virtuasoc/integration-teams";
import { renderReportMarkdown } from "@virtuasoc/reporting";

import type { Db } from "../db.js";

export type DistributeReportJobPayload = {
  tenantId: string;
  reportId: string;
  distributionId: string;
  channel: "email" | "teams";
  target?: string;
  subject: string;
  actorSub?: string;
};

type ReportRow = {
  id: string;
  title: string;
  status: string;
  definition_id: string;
  full_markdown: string | null;
  evidence_ids: string[];
};

type ReportSectionRow = {
  id: string;
  title: string;
  content_markdown: string;
  evidence_ids: string[];
};

function getSmtpConfig(): SmtpConfig | null {
  const host = (process.env.SMTP_HOST ?? "").trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = (process.env.SMTP_USER ?? "").trim();
  const pass = (process.env.SMTP_PASS ?? "").trim();
  const from = (process.env.SMTP_FROM ?? "").trim();
  if (!user || !pass || !from) return null;
  return { host, port: Number.isFinite(port) ? port : 587, user, pass, from };
}

function redactPii(text: string): string {
  if ((process.env.REDACT_PII_ON_DISTRIBUTION ?? "true") === "false") return text;
  return (
    text
      // emails
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      // SSN
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
      // loose-ish phone patterns
      .replace(/\b(\+?\d{1,2}\s*)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, "[REDACTED_PHONE]")
  );
}

async function ensureReportMarkdown(db: Db, tenantId: string, reportId: string): Promise<{ title: string; markdown: string }> {
  const reportRows = await db<ReportRow[]>`
    SELECT id, title, status, definition_id, full_markdown, evidence_ids
    FROM reports
    WHERE tenant_id = ${tenantId} AND id = ${reportId}
  `;
  if (!reportRows.length) throw new Error("Report not found");
  const report = reportRows[0]!;

  if (report.full_markdown?.trim()) return { title: report.title, markdown: report.full_markdown };

  const sectionRows = await db<ReportSectionRow[]>`
    SELECT id, title, content_markdown, evidence_ids
    FROM report_sections
    WHERE report_id = ${report.id}
    ORDER BY id ASC
  `;

  // union of all evidence ids
  const evidenceIdSet = new Set<string>();
  for (const s of sectionRows) for (const eid of s.evidence_ids ?? []) evidenceIdSet.add(String(eid));
  for (const eid of report.evidence_ids ?? []) evidenceIdSet.add(String(eid));
  const evidenceIds = Array.from(evidenceIdSet);

  const evidence = evidenceIds.length
    ? await db<{ id: string; title: string | null; source_uri: string | null }[]>`
        SELECT id, title, source_uri
        FROM evidence_items
        WHERE tenant_id = ${tenantId} AND id = ANY(${db.array(evidenceIds, 2950)})
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
    WHERE tenant_id = ${tenantId} AND id = ${report.id}
  `;

  return { title: report.title, markdown };
}

export async function distributeReport(db: Db, payload: DistributeReportJobPayload) {
  const actor = payload.actorSub ?? null;

  await db`
    UPDATE distribution_records
    SET status = ${"sending"}, error = NULL
    WHERE tenant_id = ${payload.tenantId} AND id = ${payload.distributionId}
  `;

  try {
    const { title, markdown } = await ensureReportMarkdown(db, payload.tenantId, payload.reportId);
    const subject = payload.subject?.trim() || title || "VirtuaSOC Report";
    const text = redactPii(markdown);

    if (payload.channel === "email") {
      const smtp = getSmtpConfig();
      if (!smtp) throw new Error("SMTP not configured (SMTP_HOST/PORT/USER/PASS/FROM)");
      const to = (payload.target ?? "").trim();
      if (!to) throw new Error("Missing email target");
      await sendEmail(smtp, to, subject, text);
    } else {
      // Prefer per-tenant Teams webhook if configured; otherwise fall back to global TEAMS_WEBHOOK_URL.
      let webhookUrl = "";
      try {
        const rows = await db<{ value: string; enabled: boolean }[]>`
          SELECT value, enabled
          FROM distribution_targets
          WHERE tenant_id = ${payload.tenantId} AND kind = ${"teams_webhook"}
          LIMIT 1
        `;
        if (rows[0]?.enabled) webhookUrl = String(rows[0]!.value ?? "").trim();
      } catch {
        // Table may not exist yet on older tenant DBs.
      }
      if (!webhookUrl) webhookUrl = (process.env.TEAMS_WEBHOOK_URL ?? "").trim();
      if (!webhookUrl) throw new Error("TEAMS_WEBHOOK_URL not configured");
      await sendTeamsWebhook(webhookUrl, { title: subject, text });
    }

    await db`
      UPDATE distribution_records
      SET status = ${"sent"}, sent_at = NOW(), error = NULL
      WHERE tenant_id = ${payload.tenantId} AND id = ${payload.distributionId}
    `;

    await db`
      INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
      VALUES (
        ${randomUUID()},
        ${payload.tenantId},
        ${"report.distribution.sent"},
        ${actor},
        ${"report"},
        ${payload.reportId},
        ${db.json({ distributionId: payload.distributionId, channel: payload.channel, target: payload.channel === "email" ? payload.target : "teams" })}
      )
    `;
  } catch (err) {
    const message = String((err as any)?.message ?? err);

    await db`
      UPDATE distribution_records
      SET status = ${"failed"}, error = ${message}
      WHERE tenant_id = ${payload.tenantId} AND id = ${payload.distributionId}
    `;

    await db`
      INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
      VALUES (
        ${randomUUID()},
        ${payload.tenantId},
        ${"report.distribution.failed"},
        ${actor},
        ${"report"},
        ${payload.reportId},
        ${db.json({ distributionId: payload.distributionId, channel: payload.channel, error: message })}
      )
    `;

    throw err;
  }
}


