export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  meaning: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityGrade,
  SourceReliabilityDescriptor
> = {
  A: {
    grade: "A",
    meaning: "Completely reliable; history of accurate reporting.",
  },
  B: {
    grade: "B",
    meaning: "Usually reliable; minor gaps or isolated inaccuracies.",
  },
  C: {
    grade: "C",
    meaning: "Fairly reliable; mixed record that needs corroboration.",
  },
  D: {
    grade: "D",
    meaning: "Not usually reliable; significant doubts remain.",
  },
  E: {
    grade: "E",
    meaning: "Unreliable; known issues with accuracy or intent.",
  },
  F: {
    grade: "F",
    meaning: "Cannot be judged; no prior reporting history.",
  },
};

export function getSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[grade];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  meaning: string;
}

export const CONFIDENCE_SCALE: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    meaning: "Judgment is well-supported by multiple consistent sources.",
  },
  moderate: {
    level: "moderate",
    meaning: "Judgment is plausible but depends on limited or inferential data.",
  },
  low: {
    level: "low",
    meaning: "Judgment is speculative and relies on sparse or conflicting data.",
  },
};

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_SCALE[level];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // 1-25
  category: RiskCategory;
}

export type RiskMatrix = RiskScore[][];

const RISK_CATEGORY_RULES: { max: number; category: RiskCategory }[] = [
  { max: 6, category: "low" },
  { max: 12, category: "moderate" },
  { max: 19, category: "high" },
  { max: 25, category: "critical" },
];

function assertScale(
  value: number,
  label: "likelihood" | "impact",
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(
      `${label} must be an integer between 1 and 5. Received: ${value}`,
    );
  }
}

function categorize(score: number): RiskCategory {
  const rule = RISK_CATEGORY_RULES.find((r) => score <= r.max);
  if (!rule) {
    throw new Error(`Score ${score} exceeds supported thresholds`);
  }
  return rule.category;
}

export function deriveRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertScale(likelihood, "likelihood");
  assertScale(impact, "impact");

  const score = likelihood * impact;

  return {
    likelihood,
    impact,
    score,
    category: categorize(score),
  };
}

const SCALE_VALUES: LikelihoodLevel[] = [1, 2, 3, 4, 5];

export const RISK_MATRIX: RiskMatrix = SCALE_VALUES.map((likelihood) =>
  SCALE_VALUES.map((impact) => deriveRiskScore(likelihood, impact)),
);

export type ActionStatus = "planned" | "in_progress" | "done";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionStatus;
}

export interface ActionItemInput {
  action: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}

function normalizeNonEmpty(value: string, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function normalizeDeadline(deadline: string): string {
  const value = normalizeNonEmpty(deadline, "deadline");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`deadline must be a valid ISO date. Received: ${deadline}`);
  }
  return date.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const action = normalizeNonEmpty(input.action, "action");
  const owner = normalizeNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);

  return {
    action,
    owner,
    deadline,
    status: input.status ?? "planned",
  };
}
