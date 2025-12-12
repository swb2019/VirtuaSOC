export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_MAP: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "Past reporting always confirmed; no doubt about authenticity.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts exist but history shows consistent accuracy.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Mixed record; corroboration required for confidence.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Frequent inaccuracies; only usable with strong confirmation.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Significant credibility issues; treat as suspect intelligence.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "Insufficient history to determine reliability.",
  },
};

export const SOURCE_RELIABILITY_SCALE = SOURCE_RELIABILITY_MAP;

export function describeSourceReliability(
  reliability: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_MAP[reliability];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_ORDER: readonly ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
] as const;

export function confidenceRank(level: ConfidenceLevel): number {
  return CONFIDENCE_ORDER.indexOf(level);
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskLevel =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  level: RiskLevel;
}

export const LIKELIHOOD_SCALE: readonly LikelihoodLevel[] = [
  1, 2, 3, 4, 5,
] as const;
export const IMPACT_SCALE: readonly ImpactLevel[] = [1, 2, 3, 4, 5] as const;

const RISK_THRESHOLDS: { level: RiskLevel; maxInclusive: number }[] = [
  { level: "minimal", maxInclusive: 4 },
  { level: "low", maxInclusive: 9 },
  { level: "moderate", maxInclusive: 14 },
  { level: "high", maxInclusive: 20 },
  { level: "critical", maxInclusive: 25 },
];

function riskLevelForScore(score: number): RiskLevel {
  const threshold =
    RISK_THRESHOLDS.find((entry) => score <= entry.maxInclusive) ??
    RISK_THRESHOLDS[RISK_THRESHOLDS.length - 1];
  return threshold.level;
}

export const RISK_MATRIX: ReadonlyArray<ReadonlyArray<RiskLevel>> =
  LIKELIHOOD_SCALE.map((likelihood) =>
    IMPACT_SCALE.map((impact) =>
      riskLevelForScore(likelihood * impact),
    ) as ReadonlyArray<RiskLevel>,
  );

export function computeRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    level: RISK_MATRIX[likelihood - 1][impact - 1],
  };
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const action = input.action?.trim();
  if (!action) {
    throw new Error("Action description is required.");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("Owner is required.");
  }

  const deadline = normalizeDeadline(input.deadline);

  return {
    action,
    owner,
    deadline,
  };
}

function normalizeDeadline(deadline: string): string {
  if (!deadline) {
    throw new Error("Deadline is required.");
  }
  const time = Date.parse(deadline);
  if (Number.isNaN(time)) {
    throw new Error("Deadline must be an ISO 8601 date string.");
  }
  return new Date(time).toISOString();
}

