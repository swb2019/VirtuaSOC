export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_MEANINGS: Record<SourceReliability, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

export function isSourceReliability(value: string): value is SourceReliability {
  return value in SOURCE_RELIABILITY_MEANINGS;
}

export type ConfidenceLevel = "high" | "moderate" | "low";
export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskLevel = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  level: RiskLevel;
}

const MATRIX_VALUES: readonly LikelihoodLevel[] = [1, 2, 3, 4, 5];

const RISK_LEVEL_BANDS: { level: RiskLevel; min: number; max: number }[] = [
  { level: "minimal", min: 1, max: 4 },
  { level: "low", min: 5, max: 9 },
  { level: "moderate", min: 10, max: 14 },
  { level: "high", min: 15, max: 19 },
  { level: "critical", min: 20, max: 25 },
];

function ensureMatrixValue(
  value: number,
  type: "likelihood" | "impact",
): LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(
      `Invalid ${type} value "${value}". Expected integer between 1 and 5.`,
    );
  }
  return value as LikelihoodLevel;
}

function deriveRiskLevel(score: number): RiskLevel {
  const band =
    RISK_LEVEL_BANDS.find((candidate) => {
      return score >= candidate.min && score <= candidate.max;
    }) ?? RISK_LEVEL_BANDS[RISK_LEVEL_BANDS.length - 1];
  return band.level;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const normalizedLikelihood = ensureMatrixValue(likelihood, "likelihood");
  const normalizedImpact = ensureMatrixValue(impact, "impact");
  const score = normalizedLikelihood * normalizedImpact;
  return {
    likelihood: normalizedLikelihood,
    impact: normalizedImpact,
    score,
    level: deriveRiskLevel(score),
  };
}

export function buildRiskMatrix(): RiskScore[][] {
  return MATRIX_VALUES.map((likelihood) =>
    MATRIX_VALUES.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) {
      throw new Error("Deadline date is invalid");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("Deadline is required");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid deadline format: "${deadline}"`);
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
}): ActionItem {
  return {
    action: requireNonEmpty(input.action, "Action description"),
    owner: requireNonEmpty(input.owner, "Action owner"),
    deadline: normalizeDeadline(input.deadline),
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  now: Date = new Date(),
): boolean {
  const parsed = new Date(item.deadline);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid stored deadline "${item.deadline}"`);
  }
  return parsed.getTime() < now.getTime();
}
