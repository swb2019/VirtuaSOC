export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable; no doubt about veracity.",
  B: "Usually reliable; minor doubt based on past reporting.",
  C: "Fairly reliable; some doubt or mixed historical accuracy.",
  D: "Not usually reliable; significant doubt remains.",
  E: "Unreliable; confirmed inaccuracies or serious concerns.",
  F: "Reliability cannot be judged; insufficient basis.",
};

export function describeSourceReliability(scale: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[scale];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "moderate", "low"];

export function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return CONFIDENCE_LEVELS.includes(value as ConfidenceLevel);
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  category: "low" | "moderate" | "high" | "critical";
}

export type RiskMatrix = RiskScore[][];

const LIKELIHOOD_VALUES: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_VALUES: ImpactLevel[] = [1, 2, 3, 4, 5];

const RISK_CATEGORY_THRESHOLDS: { max: number; category: RiskScore["category"]; }[] = [
  { max: 6, category: "low" },
  { max: 12, category: "moderate" },
  { max: 18, category: "high" },
];

function assertLevel(value: number, field: string): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${field} must be an integer between 1 and 5`);
  }
}

function categorizeRisk(value: number): RiskScore["category"] {
  const match = RISK_CATEGORY_THRESHOLDS.find((threshold) => value <= threshold.max);
  return match ? match.category : "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLevel(likelihood, "likelihood");
  assertLevel(impact, "impact");

  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    category: categorizeRisk(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_VALUES.map((likelihood) =>
    IMPACT_VALUES.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export const ACTION_ITEM_STATUS = {
  Pending: "pending",
  InProgress: "in-progress",
  Completed: "completed",
} as const;

export type ActionItemStatus =
  (typeof ACTION_ITEM_STATUS)[keyof typeof ACTION_ITEM_STATUS];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

const ACTION_ITEM_STATUSES: ActionItemStatus[] = Object.values(
  ACTION_ITEM_STATUS,
);

function ensureNonEmpty(value: string, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeIsoDate(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date string");
  }
  return parsed.toISOString();
}

function assertStatus(status: string): asserts status is ActionItemStatus {
  if (!ACTION_ITEM_STATUSES.includes(status as ActionItemStatus)) {
    throw new Error(
      `status must be one of: ${ACTION_ITEM_STATUSES.join(", ")}`,
    );
  }
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const description = ensureNonEmpty(input.description, "description");
  const owner = ensureNonEmpty(input.owner, "owner");
  const normalizedDeadline = normalizeIsoDate(input.deadline);
  const status = input.status ?? "pending";
  assertStatus(status);

  return {
    description,
    owner,
    deadline: normalizedDeadline,
    status,
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date,
): boolean {
  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error("referenceDate must be a valid Date instance");
  }

  const deadlineMs = Date.parse(item.deadline);
  if (Number.isNaN(deadlineMs)) {
    throw new Error("ActionItem deadline is not a valid ISO date");
  }

  return (
    deadlineMs < referenceDate.getTime() &&
    item.status !== ACTION_ITEM_STATUS.Completed
  );
}
