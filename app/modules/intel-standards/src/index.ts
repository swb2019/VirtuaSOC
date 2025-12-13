export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[] = [
  {
    code: "A",
    label: "Completely reliable",
    description:
      "History of complete reliability; trusted without reservation for critical decisions.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description:
      "Delayed or minor variances possible but generally corroborated by other sources.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description:
      "Some past issues or limited track record; requires supporting evidence before use.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description:
      "Significant gaps or contradictions recorded; use only with substantial corroboration.",
  },
  {
    code: "E",
    label: "Unreliable",
    description:
      "History of inaccuracies or manipulation; rely only when independently verified.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description:
      "New or unknown source; insufficient data to rate at this time.",
  },
] as const;

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: readonly ConfidenceDescriptor[] = [
  {
    level: "high",
    description:
      "Evidence is well corroborated, consistent, and sufficient to support analytic judgments.",
  },
  {
    level: "moderate",
    description:
      "Information is plausible but contains gaps or conflicting reporting; key assumptions remain.",
  },
  {
    level: "low",
    description:
      "Evidence is scant, questionable, or contradictory; judgments are speculative.",
  },
] as const;

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export interface RiskCell extends RiskScore {}

export type RiskMatrix = RiskCell[][]; // [likelihood][impact]

const RISK_BANDS: { maxScore: number; band: RiskBand }[] = [
  { maxScore: 4, band: "minimal" },
  { maxScore: 9, band: "low" },
  { maxScore: 14, band: "moderate" },
  { maxScore: 20, band: "high" },
  { maxScore: 25, band: "critical" },
];

function assertLevel(
  value: number,
  field: "likelihood" | "impact",
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be an integer between 1 and 5`);
  }
  if (value < 1 || value > 5) {
    throw new Error(`${field} must be between 1 and 5`);
  }
}

function resolveBand(score: number): RiskBand {
  const bucket = RISK_BANDS.find((entry) => score <= entry.maxScore);
  if (!bucket) {
    throw new Error(`Score ${score} is outside of supported risk thresholds`);
  }
  return bucket.band;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLevel(likelihood, "likelihood");
  assertLevel(impact, "impact");
  const score = likelihood * impact;
  const band = resolveBand(score);
  return { likelihood, impact, score, band };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const row: RiskCell[] = [];
    const likelihoodLevel = likelihood as LikelihoodLevel;
    for (let impact = 1; impact <= 5; impact++) {
      const impactLevel = impact as ImpactLevel;
      row.push(calculateRiskScore(likelihoodLevel, impactLevel));
    }
    matrix.push(row);
  }
  return matrix;
}

export type ActionItemStatus = "open" | "in-progress" | "done";

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = assertNonEmpty(deadline, "deadline");
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const summary = assertNonEmpty(input.summary, "summary");
  const owner = assertNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "open";
  return { summary, owner, deadline, status };
}
