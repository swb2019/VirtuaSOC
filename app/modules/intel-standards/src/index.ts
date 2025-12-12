export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliability,
  string
> = {
  A: "Completely reliable; no doubt about authenticity, trustworthiness, or competence.",
  B: "Usually reliable; minor doubt regarding authenticity or trustworthiness.",
  C: "Fairly reliable; some doubt, but has provided useful intelligence previously.",
  D: "Not usually reliable; significant doubt, corroboration required.",
  E: "Unreliable; history of false or misleading reporting.",
  F: "Reliability cannot be judged; insufficient information available.",
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVEL_DESCRIPTIONS: Record<
  ConfidenceLevel,
  string
> = {
  high: "High confidence: information is well-corroborated with consistent sources.",
  moderate:
    "Moderate confidence: information is plausible but not sufficiently corroborated.",
  low: "Low confidence: information is scant, questionable, or fragmented.",
};

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

const LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  rating: RiskRating;
}

export type RiskMatrix = RiskScore[][];

export type ActionStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

function assertLevel(value: LikelihoodLevel | ImpactLevel, label: string): void {
  if (!LEVELS.includes(value as LikelihoodLevel)) {
    throw new Error(`${label} must be an integer between 1 and 5. Received: ${value}`);
  }
}

function deriveRating(score: number): RiskRating {
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

export function describeSourceReliability(level: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[level];
}

export function describeConfidence(level: ConfidenceLevel): string {
  return CONFIDENCE_LEVEL_DESCRIPTIONS[level];
}

export function evaluateRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLevel(likelihood, "likelihood");
  assertLevel(impact, "impact");

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    rating: deriveRating(score),
  };
}

export function generateRiskMatrix(): RiskMatrix {
  return LEVELS.map((likelihood) =>
    LEVELS.map((impact) => evaluateRisk(likelihood, impact)),
  );
}

function normalizeDeadline(deadline: string): string {
  if (!deadline || deadline.trim().length === 0) {
    throw new Error("deadline is required");
  }
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`deadline must be a valid ISO 8601 date. Received: ${deadline}`);
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const description = input.description?.trim();
  if (!description) {
    throw new Error("description is required");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("owner is required");
  }

  const deadline = normalizeDeadline(input.deadline);

  return {
    description,
    owner,
    deadline,
    status: input.status ?? "pending",
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date | string = new Date(),
): boolean {
  const reference =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) {
    throw new Error(
      `referenceDate must be a valid Date or ISO string. Received: ${referenceDate}`,
    );
  }

  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error(
      `action item deadline is invalid. Received: ${item.deadline}`,
    );
  }

  if (item.status === "complete") {
    return false;
  }

  return reference.getTime() > deadline.getTime();
}
