import type { ReportDraft } from "./reportFactory.js";

export type EvidenceRef = {
  id: string;
  title?: string | null;
  sourceUri?: string | null;
};

export function renderReportMarkdown(draft: ReportDraft, evidence: EvidenceRef[]): string {
  const lines: string[] = [];
  lines.push(`# ${draft.title}`);
  lines.push("");
  lines.push(`_Definition_: \`${draft.definitionId}\``);
  lines.push("");

  for (const s of draft.sections) {
    lines.push(`## ${s.title}`);
    lines.push("");
    lines.push(s.contentMarkdown?.trim() ? s.contentMarkdown.trim() : "_(draft)_");
    lines.push("");
  }

  if (evidence.length) {
    lines.push("## Sources");
    lines.push("");
    evidence.forEach((e, idx) => {
      const label = e.title?.trim() ? e.title.trim() : e.id;
      if (e.sourceUri) lines.push(`${idx + 1}. ${label} — ${e.sourceUri}`);
      else lines.push(`${idx + 1}. ${label}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}



