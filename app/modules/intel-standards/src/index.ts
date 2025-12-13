export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_DESCRIPTORS: Record<SourceReliability, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVEL_DESCRIPTORS: Record<ConfidenceLevel, string> = {
  high: "High confidence in analytic judgment",
  moderate: "Moderate confidence; plausible alternative interpretations",
  low: "Low confidence; information is scant, questionable, or fragmented",
};

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // 1-25
  rating: RiskRating;
}

export type RiskMatrix = RiskCell[][];

const LIKELIHOOD_LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: ImpactLevel[] = [1, 2, 3, 4, 5];

function assertIsScaleValue(
  value: number,
  label: string,
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5.`);
  }
}

function ratingForScore(score: number): RiskRating {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 18) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskCell {
  assertIsScaleValue(likelihood, "Likelihood");
  assertIsScaleValue(impact, "Impact");

  const score = likelihood * impact;

  return {
    likelihood,
    impact,
    score,
    rating: ratingForScore(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601 date
}

function ensureIso8601(date: string): void {
  const timestamp = Date.parse(date);
  if (Number.isNaN(timestamp)) {
    throw new Error("Deadline must be a valid ISO 8601 timestamp.");
  }
}

export function createActionItem(input: ActionItem): ActionItem {
  const summary = input.summary.trim();
  const owner = input.owner.trim();

  if (!summary) {
    throw new Error("Action item summary is required.");
  }

  if (!owner) {
    throw new Error("Action item owner is required.");
  }

  ensureIso8601(input.deadline);

  return {
    summary,
    owner,
    deadline: new Date(input.deadline).toISOString(),
  };
}
