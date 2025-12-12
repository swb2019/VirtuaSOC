export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_DATA: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = Object.freeze({
  A: {
    code: "A",
    label: "Completely reliable",
    description: "History of reliability; no doubt about authenticity, trustworthiness, or competency.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubt; usually authentic, trustworthy, and competent.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Qualified doubt about authenticity, trustworthiness, or competency.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt; provided information is often questionable or incorrect.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Information is regularly false or cannot be trusted.",
  },
  F: {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient data to determine reliability.",
  },
});

export const SOURCE_RELIABILITY_SCALE = SOURCE_RELIABILITY_DATA;

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS = [
  "high",
  "moderate",
  "low",
] as const satisfies readonly ConfidenceLevel[];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskAssessment {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  category: RiskCategory;
}

const ISO_8601_UTC_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function normalizeMatrixValue(
  value: number,
  label: "likelihood" | "impact",
): LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${label} must be an integer between 1 and 5`);
  }
  return value as LikelihoodLevel;
}

function categorizeRisk(score: number): RiskCategory {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 20) {
    return "high";
  }
  return "critical";
}

export function createRiskAssessment(input: {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
}): RiskAssessment {
  const likelihood = normalizeMatrixValue(input.likelihood, "likelihood");
  const impact = normalizeMatrixValue(input.impact, "impact") as ImpactLevel;
  const score = likelihood * impact;

  return {
    likelihood,
    impact,
    score,
    category: categorizeRisk(score),
  };
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
}

interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string;
}

function normalizeText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} cannot be empty`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = deadline.trim();
  if (!ISO_8601_UTC_REGEX.test(trimmed)) {
    throw new Error("deadline must be an ISO-8601 UTC string (YYYY-MM-DDTHH:MM:SS(.sss)Z)");
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error("deadline must be a valid date");
  }
  return new Date(parsed).toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  return {
    description: normalizeText(input.description, "description"),
    owner: normalizeText(input.owner, "owner"),
    deadline: normalizeDeadline(input.deadline),
  };
}
