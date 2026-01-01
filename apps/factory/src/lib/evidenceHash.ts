import { createHash } from "node:crypto";

export type EvidenceHashInput = {
  sourceUri?: string | null;
  title?: string | null;
  summary?: string | null;
  contentText?: string | null;
};

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "";
}

export function computeEvidenceHash(input: EvidenceHashInput): string {
  const payload = [
    `sourceUri:${norm(input.sourceUri)}`,
    `title:${norm(input.title)}`,
    `summary:${norm(input.summary)}`,
    `contentText:${norm(input.contentText)}`,
  ].join("\n");

  return createHash("sha256").update(payload).digest("hex");
}


