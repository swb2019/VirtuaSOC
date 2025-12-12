export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  description: string;
}

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliabilityGrade,
  string
> = {
  A: "Completely reliable; proven history of accurate reporting.",
  B: "Usually reliable; minor issues observed in past production.",
  C: "Fairly reliable; mixed history that requires corroboration.",
  D: "Not usually reliable; significant validation gaps.",
  E: "Unreliable; reporting contradicts known facts.",
  F: "Cannot be judged; no prior reporting history.",
};

export const sourceReliabilityScale: SourceReliabilityDescriptor[] = (
  Object.keys(SOURCE_RELIABILITY_DESCRIPTIONS) as SourceReliabilityGrade[]
).map((grade) => ({
  grade,
  description: SOURCE_RELIABILITY_DESCRIPTIONS[grade],
}));

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  high: "High confidence; strong analytic grounding with corroborated sources.",
  moderate:
    "Moderate confidence; plausible judgment but requires additional validation.",
  low: "Low confidence; sparse or questionable sourcing.",
};

export const confidenceScale: ConfidenceDescriptor[] = (
  Object.keys(CONFIDENCE_DESCRIPTIONS) as ConfidenceLevel[]
).map((level) => ({
  level,
  description: CONFIDENCE_DESCRIPTIONS[level],
}));

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  category: RiskCategory;
}

const LIKELIHOOD_LEVELS: readonly LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: readonly ImpactLevel[] = [1, 2, 3, 4, 5];

function isValidLevel(value: number): value is LikelihoodLevel & ImpactLevel {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function categorizeScore(score: number): RiskCategory {
  if (score <= 5) return "low";
  if (score <= 12) return "moderate";
  if (score <= 19) return "high";
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  if (!isValidLevel(likelihood)) {
    throw new Error("Likelihood must be an integer between 1 and 5.");
  }
  if (!isValidLevel(impact)) {
    throw new Error("Impact must be an integer between 1 and 5.");
  }

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    category: categorizeScore(score),
  };
}

export const riskMatrix: RiskScore[][] = LIKELIHOOD_LEVELS.map(
  (likelihood) =>
    IMPACT_LEVELS.map((impact) => calculateRiskScore(likelihood, impact)),
);

export interface ActionItem {
  owner: string;
  description: string;
  deadline: string; // ISO 8601
}

export interface ActionItemInput {
  owner: string;
  description: string;
  deadline: string | Date;
}

const MS_IN_DAY = 86_400_000;

function assertNonEmpty(field: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (isNaN(deadline.getTime())) {
      throw new Error("Deadline date is invalid.");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("Deadline is required.");
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error("Deadline must be a valid date.");
  }
  return parsed.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const owner = assertNonEmpty("Owner", input.owner);
  const description = assertNonEmpty("Description", input.description);
  const deadline = normalizeDeadline(input.deadline);

  return {
    owner,
    description,
    deadline,
  };
}

function validateReferenceDate(referenceDate: Date): Date {
  if (isNaN(referenceDate.getTime())) {
    throw new Error("Reference date must be valid.");
  }
  return referenceDate;
}

export function isActionItemDueSoon(
  item: ActionItem,
  withinDays: number,
  referenceDate: Date = new Date(),
): boolean {
  if (withinDays < 0) {
    throw new Error("withinDays must be non-negative.");
  }

  const reference = validateReferenceDate(referenceDate);
  const deadline = new Date(item.deadline);

  if (isNaN(deadline.getTime())) {
    throw new Error("Action item deadline must be a valid date.");
  }

  const diffMs = deadline.getTime() - reference.getTime();

  if (diffMs < 0) {
    return true;
  }

  return diffMs <= withinDays * MS_IN_DAY;
}
