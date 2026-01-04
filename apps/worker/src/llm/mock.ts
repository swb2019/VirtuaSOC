import type { GeneratedProductJson } from "../products/productSchema.js";

export function mockGenerateProduct(args: {
  productName: string;
  evidenceRefs: string[];
  requireChangeFromLast: boolean;
}): GeneratedProductJson {
  const refs = args.evidenceRefs.slice(0, Math.max(1, Math.min(5, args.evidenceRefs.length)));
  const now = new Date().toISOString();
  const refA = refs[0] ?? "EVD-001";
  const refB = refs[1] ?? refA;
  const refC = refs[2] ?? refA;

  return {
    title: `${args.productName} (Mock)`,
    keyJudgments: [
      `This is a mock-generated product for development/testing. (${refA})`,
      `All claims are derived only from the provided evidence references. (${refB})`,
      `Key judgments include explicit evidence citations as required. (${refC})`,
    ],
    indicators: ["Monitor for follow-on reporting tied to the cited evidence references."],
    evidenceRefs: refs,
    bodyMarkdown:
      `GeneratedAt: ${now}\n\n` +
      `This is a mock narrative body. Evidence refs: ${refs.join(", ")}.\n`,
    likelihood: { term: "possible", min: 0.3, max: 0.6 },
    risk: { likelihood: 3, impact: 3 },
    actions: [
      { owner: "Analyst", deadline: now.slice(0, 10), title: "Validate the evidence and update the draft." },
    ],
    changeFromLast: args.requireChangeFromLast ? `No prior product available in mock mode. (${refA})` : undefined,
  };
}


