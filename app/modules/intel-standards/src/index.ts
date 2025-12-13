export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "History of complete reliability; trusted without reservation.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts only; typically confirms with other sources.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Some questionable reports but generally credible.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubts; requires independent corroboration.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "History of inconsistent or false reporting.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "Insufficient information to assess reliability.",
  },
};

export const SOURCE_RELIABILITY_SCALE = SOURCE_RELIABILITY_DESCRIPTIONS;

export function getSourceReliabilityDescriptor(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_DESCRIPTIONS[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_DESCRIPTIONS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    description:
      "Strongly backed by evidence with little or no reasonable doubt.",
  },
  moderate: {
    level: "moderate",
    description:
      "Evidence may be incomplete, but judgments remain more likely than not.",
  },
  low: {
    level: "low",
    description:
      "Sparse or conflicting evidence; judgments carry significant uncertainty.",
  },
};

export const CONFIDENCE_SCALE = CONFIDENCE_DESCRIPTIONS;

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_DESCRIPTIONS[level];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskScore = number;
export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
  rating: RiskRating;
}

export interface RiskRatingThresholds {
  lowMax: number;
  moderateMax: number;
  highMax: number;
}

export const DEFAULT_RISK_THRESHOLDS: RiskRatingThresholds = {
  lowMax: 6,
  moderateMax: 12,
  highMax: 19,
};

const LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];

function validateThresholds(
  thresholds: RiskRatingThresholds,
): RiskRatingThresholds {
  const { lowMax, moderateMax, highMax } = thresholds;
  if (lowMax < 1 || highMax > 25) {
    throw new Error("Risk thresholds must stay within scores 1-25.");
  }
  if (!(lowMax < moderateMax && moderateMax < highMax)) {
    throw new Error("Risk thresholds must be strictly increasing.");
  }
  return thresholds;
}

function scoringThresholds(
  thresholds?: RiskRatingThresholds,
): RiskRatingThresholds {
  if (!thresholds) {
    return DEFAULT_RISK_THRESHOLDS;
  }
  return validateThresholds(thresholds);
}

function determineRiskRating(
  score: RiskScore,
  thresholds: RiskRatingThresholds,
): RiskRating {
  if (score <= thresholds.lowMax) {
    return "low";
  }
  if (score <= thresholds.moderateMax) {
    return "moderate";
  }
  if (score <= thresholds.highMax) {
    return "high";
  }
  return "critical";
}

export function evaluateRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
  thresholds?: RiskRatingThresholds,
): RiskCell {
  const score = likelihood * impact;
  const effectiveThresholds = scoringThresholds(thresholds);
  return {
    likelihood,
    impact,
    score,
    rating: determineRiskRating(score, effectiveThresholds),
  };
}

export type RiskMatrix = RiskCell[][];

export function createRiskMatrix(
  thresholds?: RiskRatingThresholds,
): RiskMatrix {
  const result: RiskMatrix = [];
  const effectiveThresholds = scoringThresholds(thresholds);
  for (const likelihood of LEVELS) {
    const row: RiskCell[] = [];
    for (const impact of LEVELS) {
      row.push(evaluateRisk(likelihood, impact, effectiveThresholds));
    }
    result.push(row);
  }
  return result;
}

export type ActionItemStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  title: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

function ensureNonEmpty(value: string, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} must be provided.`);
  }
  return value.trim();
}

function normalizeDeadline(deadline: string | Date): string {
  const dateValue =
    typeof deadline === "string" ? new Date(deadline) : new Date(deadline);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("Deadline must be a valid date.");
  }
  return dateValue.toISOString();
}

export function createActionItem(input: {
  title: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem {
  return {
    title: ensureNonEmpty(input.title, "title"),
    owner: ensureNonEmpty(input.owner, "owner"),
    deadline: normalizeDeadline(input.deadline),
    status: input.status ?? "pending",
  };
}

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  const deadlineDate = new Date(action.deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    throw new Error("Action item deadline is not a valid date.");
  }
  return deadlineDate.getTime() < referenceDate.getTime();
}
