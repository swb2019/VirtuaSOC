import { describe, expect, it } from "vitest";

import { validateGeneratedProductJson } from "./productSchema.js";

function baseRaw(overrides?: Partial<Record<string, unknown>>) {
  return {
    title: "Daily Intelligence Summary",
    keyJudgments: ["KJ1 (EVD-001)", "KJ2 (EVD-002)", "KJ3 (EVD-001)"],
    indicators: ["Indicator A"],
    evidenceRefs: ["EVD-001", "EVD-002"],
    bodyMarkdown: "Narrative body with a claim (EVD-001).",
    likelihood: { term: "Likely", min: 0.4, max: 0.6 },
    risk: { likelihood: 3, impact: 4 },
    actions: [{ owner: "GSOC", deadline: "2026-01-01", title: "Triage and verify" }],
    changeFromLast: "Change from last: new detail observed (EVD-002).",
    ...(overrides ?? {}),
  };
}

describe("validateGeneratedProductJson (rubric options)", () => {
  it("passes a valid output when strict options are enabled", () => {
    const allowed = new Set(["EVD-001", "EVD-002"]);
    const r = validateGeneratedProductJson(baseRaw(), allowed, true, {
      requireKeyJudgmentEvidenceRefs: true,
      requireEvidenceRefsMatchUsed: true,
    });
    expect(r.ok).toBe(true);
  });

  it("fails when a key judgment lacks an evidence ref and requireKeyJudgmentEvidenceRefs=true", () => {
    const allowed = new Set(["EVD-001", "EVD-002"]);
    const r = validateGeneratedProductJson(
      baseRaw({ keyJudgments: ["KJ1 (EVD-001)", "KJ2 (EVD-002)", "KJ3 no citation"] }),
      allowed,
      false,
      { requireKeyJudgmentEvidenceRefs: true },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/keyJudgment.*cite/i);
  });

  it("fails when evidenceRefs includes unused refs and requireEvidenceRefsMatchUsed=true", () => {
    const allowed = new Set(["EVD-001", "EVD-002"]);
    const r = validateGeneratedProductJson(
      baseRaw({
        // Use only EVD-001 everywhere, but still list EVD-002 in evidenceRefs.
        keyJudgments: ["KJ1 (EVD-001)", "KJ2 (EVD-001)", "KJ3 (EVD-001)"],
        bodyMarkdown: "Body uses only (EVD-001).",
        changeFromLast: "Change from last uses only (EVD-001).",
      }),
      allowed,
      true,
      { requireEvidenceRefsMatchUsed: true },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unused ref/i);
  });

  it("fails when bodyMarkdown uses a ref not present in evidenceRefs", () => {
    const allowed = new Set(["EVD-001", "EVD-002"]);
    const r = validateGeneratedProductJson(
      baseRaw({
        evidenceRefs: ["EVD-001"],
        bodyMarkdown: "Body cites (EVD-002).",
        // Ensure other sections don't include EVD-002.
        keyJudgments: ["KJ1 (EVD-001)", "KJ2 (EVD-001)", "KJ3 (EVD-001)"],
        changeFromLast: "Change uses only (EVD-001).",
      }),
      allowed,
      false,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/evidenceRefs missing ref/i);
  });
});


