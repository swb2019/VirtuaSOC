export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export type GeneratedAction = {
  owner: string;
  deadline: string; // ISO date or datetime
  title: string;
  notes?: string;
};

export type GeneratedProductJson = {
  title: string;
  keyJudgments: string[]; // 3-5
  indicators: string[];
  evidenceRefs: string[]; // EVD-###

  // Narrative body (no URLs, evidence-bound)
  bodyMarkdown: string;

  // Likelihood is separate from analytic confidence.
  likelihood: {
    term: string;
    min: number; // 0..1
    max: number; // 0..1
  };

  // Risk matrix (1..5 x 1..5)
  risk: {
    likelihood: number;
    impact: number;
  };

  actions: GeneratedAction[];

  changeFromLast?: string;
};

export type ValidationResult =
  | { ok: true; value: GeneratedProductJson }
  | { ok: false; error: string };

export type ProductValidationOptions = {
  // If true, each key judgment must include at least one blinded evidence ref (EVD-###).
  requireKeyJudgmentEvidenceRefs?: boolean;
  // If true, evidenceRefs must match the exact set of refs used in the output (KJs/body/changeFromLast).
  requireEvidenceRefsMatchUsed?: boolean;
};

function hasHttpUrl(text: string): boolean {
  return /https?:\/\//i.test(text);
}

function hasForbiddenTradecraftTerms(text: string): boolean {
  // Enforce separation of confidence vs likelihood: these must not appear in narrative.
  return /\bconfidence\b/i.test(text) || /\blikelihood\b/i.test(text);
}

function extractEvidenceRefs(text: string): string[] {
  const matches = text.match(/\bEVD-\d{3}\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function validateGeneratedProductJson(
  raw: unknown,
  allowedEvidenceRefs: Set<string>,
  requireChangeFromLast: boolean,
  options?: ProductValidationOptions,
): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Output is not an object" };
  const r: any = raw;

  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!title) return { ok: false, error: "Missing title" };
  if (hasHttpUrl(title)) return { ok: false, error: "Title contains URL" };

  const keyJudgments = Array.isArray(r.keyJudgments) ? r.keyJudgments.map(String).map((s: string) => s.trim()).filter(Boolean) : [];
  if (keyJudgments.length < 3 || keyJudgments.length > 5) {
    return { ok: false, error: "keyJudgments must be 3-5 items" };
  }
  if (keyJudgments.some((s) => hasHttpUrl(s))) return { ok: false, error: "keyJudgments contains URL" };
  const keyJudgmentRefs = keyJudgments.flatMap((s) => extractEvidenceRefs(s));
  for (const ref of keyJudgmentRefs) {
    if (!allowedEvidenceRefs.has(ref)) return { ok: false, error: `keyJudgments contains unknown evidenceRef: ${ref}` };
  }
  if (options?.requireKeyJudgmentEvidenceRefs) {
    const missing = keyJudgments.find((s) => extractEvidenceRefs(s).length === 0);
    if (missing) return { ok: false, error: "Each keyJudgment must cite at least one EVD-### reference" };
  }

  const indicators = Array.isArray(r.indicators) ? r.indicators.map(String).map((s: string) => s.trim()).filter(Boolean) : [];
  if (indicators.some((s) => hasHttpUrl(s))) return { ok: false, error: "indicators contains URL" };

  const evidenceRefs = Array.isArray(r.evidenceRefs) ? r.evidenceRefs.map(String).map((s: string) => s.trim()).filter(Boolean) : [];
  if (!evidenceRefs.length) return { ok: false, error: "evidenceRefs is required" };
  const evidenceRefsSet = new Set(evidenceRefs);
  for (const ref of evidenceRefs) {
    if (!allowedEvidenceRefs.has(ref)) return { ok: false, error: `Invalid evidenceRef: ${ref}` };
  }
  // evidenceRefs must cover any citations used in key judgments.
  for (const ref of keyJudgmentRefs) {
    if (!evidenceRefsSet.has(ref)) return { ok: false, error: `evidenceRefs missing ref used in keyJudgments: ${ref}` };
  }

  const bodyMarkdown = typeof r.bodyMarkdown === "string" ? r.bodyMarkdown.trim() : "";
  if (!bodyMarkdown) return { ok: false, error: "Missing bodyMarkdown" };
  if (hasHttpUrl(bodyMarkdown)) return { ok: false, error: "bodyMarkdown contains URL" };
  if (hasForbiddenTradecraftTerms(bodyMarkdown)) {
    return { ok: false, error: "bodyMarkdown must not mention confidence or likelihood (tradecraft rule)" };
  }
  const bodyRefs = extractEvidenceRefs(bodyMarkdown);
  for (const ref of bodyRefs) {
    if (!allowedEvidenceRefs.has(ref)) return { ok: false, error: `bodyMarkdown contains unknown evidenceRef: ${ref}` };
  }
  for (const ref of bodyRefs) {
    if (!evidenceRefsSet.has(ref)) return { ok: false, error: `evidenceRefs missing ref used in bodyMarkdown: ${ref}` };
  }

  const likelihood = r.likelihood;
  if (!likelihood || typeof likelihood !== "object") return { ok: false, error: "Missing likelihood" };
  const term = typeof (likelihood as any).term === "string" ? (likelihood as any).term.trim() : "";
  const min = Number((likelihood as any).min);
  const max = Number((likelihood as any).max);
  if (!term) return { ok: false, error: "likelihood.term is required" };
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ok: false, error: "likelihood.min/max must be numbers" };
  const min01 = clamp01(min);
  const max01 = clamp01(max);
  if (min01 > max01) return { ok: false, error: "likelihood.min must be <= likelihood.max" };

  const risk = r.risk;
  if (!risk || typeof risk !== "object") return { ok: false, error: "Missing risk" };
  const riskLikelihood = Number((risk as any).likelihood);
  const riskImpact = Number((risk as any).impact);
  if (!Number.isFinite(riskLikelihood) || riskLikelihood < 1 || riskLikelihood > 5) return { ok: false, error: "risk.likelihood must be 1..5" };
  if (!Number.isFinite(riskImpact) || riskImpact < 1 || riskImpact > 5) return { ok: false, error: "risk.impact must be 1..5" };

  const actions = Array.isArray(r.actions) ? r.actions : [];
  const parsedActions: GeneratedAction[] = [];
  for (const a of actions) {
    if (!a || typeof a !== "object") continue;
    const owner = typeof (a as any).owner === "string" ? (a as any).owner.trim() : "";
    const deadline = typeof (a as any).deadline === "string" ? (a as any).deadline.trim() : "";
    const atitle = typeof (a as any).title === "string" ? (a as any).title.trim() : "";
    const notes = typeof (a as any).notes === "string" ? (a as any).notes.trim() : undefined;
    if (!owner || !deadline || !atitle) continue;
    if (hasHttpUrl(owner) || hasHttpUrl(atitle) || (notes && hasHttpUrl(notes))) {
      return { ok: false, error: "actions contains URL" };
    }
    parsedActions.push({ owner, deadline, title: atitle, notes });
  }
  if (!parsedActions.length) return { ok: false, error: "actions must include at least 1 valid action" };

  const changeFromLast = typeof r.changeFromLast === "string" ? r.changeFromLast.trim() : "";
  if (requireChangeFromLast && !changeFromLast) {
    return { ok: false, error: "changeFromLast is required when a prior product exists" };
  }
  if (changeFromLast && hasHttpUrl(changeFromLast)) return { ok: false, error: "changeFromLast contains URL" };
  if (changeFromLast && hasForbiddenTradecraftTerms(changeFromLast)) {
    return { ok: false, error: "changeFromLast must not mention confidence or likelihood (tradecraft rule)" };
  }
  const changeRefs = changeFromLast ? extractEvidenceRefs(changeFromLast) : [];
  for (const ref of changeRefs) {
    if (!allowedEvidenceRefs.has(ref)) return { ok: false, error: `changeFromLast contains unknown evidenceRef: ${ref}` };
    if (!evidenceRefsSet.has(ref)) return { ok: false, error: `evidenceRefs missing ref used in changeFromLast: ${ref}` };
  }

  // If enabled, ensure evidenceRefs matches the exact set used by the model output.
  if (options?.requireEvidenceRefsMatchUsed) {
    const used = new Set<string>([...keyJudgmentRefs, ...bodyRefs, ...changeRefs]);
    if (!used.size) return { ok: false, error: "No evidence refs were used in the output" };
    for (const ref of evidenceRefsSet) {
      if (!used.has(ref)) return { ok: false, error: `evidenceRefs includes unused ref: ${ref}` };
    }
    for (const ref of used) {
      if (!evidenceRefsSet.has(ref)) return { ok: false, error: `evidenceRefs missing used ref: ${ref}` };
    }
  }

  return {
    ok: true,
    value: {
      title,
      keyJudgments,
      indicators,
      evidenceRefs,
      bodyMarkdown,
      likelihood: { term, min: min01, max: max01 },
      risk: { likelihood: Math.round(riskLikelihood), impact: Math.round(riskImpact) },
      actions: parsedActions,
      changeFromLast: changeFromLast || undefined,
    },
  };
}


