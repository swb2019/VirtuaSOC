export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, string>
> = Object.freeze({
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
});

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS = Object.freeze([
  "high",
  "moderate",
  "low",
] as const satisfies Readonly<ConfidenceLevel[]>);

export const LIKELIHOOD_LEVELS = Object.freeze([1, 2, 3, 4, 5] as const);
export const IMPACT_LEVELS = Object.freeze([1, 2, 3, 4, 5] as const);

export type LikelihoodLevel = (typeof LIKELIHOOD_LEVELS)[number];
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // 1-25
  category: RiskCategory;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export type ActionItemStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

const RISK_CATEGORY_THRESHOLDS: ReadonlyArray<{
  upperBound: number;
  category: RiskCategory;
}> = [
  { upperBound: 5, category: "low" },
  { upperBound: 12, category: "moderate" },
  { upperBound: 19, category: "high" },
  { upperBound: 25, category: "critical" },
];

function categorizeRisk(value: number): RiskCategory {
  const bucket = RISK_CATEGORY_THRESHOLDS.find(
    (threshold) => value <= threshold.upperBound,
  );
  return bucket?.category ?? "critical";
}

function toIsoString(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date for action item deadline");
  }
  return date.toISOString();
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    category: categorizeRisk(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem {
  const description = input.description?.trim();
  const owner = input.owner?.trim();

  if (!description) {
    throw new Error("Action item description is required");
  }
  if (!owner) {
    throw new Error("Action item owner is required");
  }

  const deadline = toIsoString(input.deadline);
  const status = input.status ?? "pending";

  return {
    description,
    owner,
    deadline,
    status,
  };
}

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: string | Date,
): boolean {
  if (action.status === "complete") {
    return false;
  }

  const reference = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(reference.getTime())) {
    throw new Error("Invalid reference date for overdue check");
  }

  return new Date(action.deadline).getTime() < reference.getTime();
}
