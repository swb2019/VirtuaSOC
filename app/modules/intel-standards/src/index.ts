export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  meaning: string;
  guidance: string;
}

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
> = {
  A: {
    code: "A",
    meaning: "Completely reliable",
    guidance: "History of complete trust; corroborated and vetted sources.",
  },
  B: {
    code: "B",
    meaning: "Usually reliable",
    guidance: "Minor caveats; generally confirmed by other reporting.",
  },
  C: {
    code: "C",
    meaning: "Fairly reliable",
    guidance: "Mixed record; needs corroboration for critical judgments.",
  },
  D: {
    code: "D",
    meaning: "Not usually reliable",
    guidance: "Significant past issues; rely only with strong confirmation.",
  },
  E: {
    code: "E",
    meaning: "Unreliable",
    guidance: "Unverified sources or questionable tradecraft.",
  },
  F: {
    code: "F",
    meaning: "Reliability cannot be judged",
    guidance: "New or unknown sources; treat with caution.",
  },
} as const;

export function describeSourceReliability(
  code: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "low" | "moderate" | "high";

const CONFIDENCE_ORDER: ConfidenceLevel[] = ["low", "moderate", "high"];

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel,
): -1 | 0 | 1 {
  if (a === b) {
    return 0;
  }
  const diff = CONFIDENCE_ORDER.indexOf(a) - CONFIDENCE_ORDER.indexOf(b);
  return diff < 0 ? -1 : 1;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  level: RiskLevel;
}

export type RiskMatrix = RiskScore[][];

const LIKELIHOOD_VALUES: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_VALUES: ImpactLevel[] = [1, 2, 3, 4, 5];

const RISK_LEVEL_THRESHOLDS = {
  low: 5,
  moderate: 12,
  high: 19,
};

function assertLikelihood(value: number): asserts value is LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError("Likelihood must be an integer between 1 and 5.");
  }
}

function assertImpact(value: number): asserts value is ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError("Impact must be an integer between 1 and 5.");
  }
}

function determineRiskLevel(value: number): RiskLevel {
  if (value <= RISK_LEVEL_THRESHOLDS.low) {
    return "low";
  }
  if (value <= RISK_LEVEL_THRESHOLDS.moderate) {
    return "moderate";
  }
  if (value <= RISK_LEVEL_THRESHOLDS.high) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLikelihood(likelihood);
  assertImpact(impact);

  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    level: determineRiskLevel(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_VALUES.map((likelihood) =>
    IMPACT_VALUES.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

function normalizeText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = deadline.trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO-8601 datetime string.");
  }
  return date.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const description = normalizeText(input.description, "description");
  const owner = normalizeText(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  return {
    description,
    owner,
    deadline,
    status,
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  if (item.status === "completed") {
    return false;
  }
  const deadlineDate = new Date(item.deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    throw new Error("Action item has invalid deadline.");
  }
  return deadlineDate.getTime() < referenceDate.getTime();
}
