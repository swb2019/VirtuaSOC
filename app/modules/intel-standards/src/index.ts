export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_SCALE_INTERNAL: Record<
  SourceReliabilityCode,
  SourceReliabilityDefinition
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, trustworthiness, or competency.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubt about authenticity, trustworthiness, or competency.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Doubtful or not confirmed; some reservations remain.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt about authenticity or trustworthiness.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Cannot be judged reliable; history shows issues.",
  },
  F: {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient basis to evaluate source reliability.",
  },
};

export const SOURCE_RELIABILITY_SCALE = Object.freeze(
  SOURCE_RELIABILITY_SCALE_INTERNAL,
);

export function isSourceReliabilityCode(
  value: string,
): value is SourceReliabilityCode {
  return Object.prototype.hasOwnProperty.call(
    SOURCE_RELIABILITY_SCALE_INTERNAL,
    value,
  );
}

export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDefinition {
  return SOURCE_RELIABILITY_SCALE_INTERNAL[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDefinition {
  level: ConfidenceLevel;
  description: string;
  rank: number;
}

const CONFIDENCE_SCALE_INTERNAL: Record<
  ConfidenceLevel,
  ConfidenceDefinition
> = {
  high: {
    level: "high",
    description: "Judgments are well-supported with consistent evidence.",
    rank: 3,
  },
  moderate: {
    level: "moderate",
    description: "Evidence is mixed, or significant assumptions remain.",
    rank: 2,
  },
  low: {
    level: "low",
    description: "Information is scant, uncorroborated, or questionable.",
    rank: 1,
  },
};

export const CONFIDENCE_SCALE = Object.freeze(CONFIDENCE_SCALE_INTERNAL);

export function describeConfidence(level: ConfidenceLevel): ConfidenceDefinition {
  return CONFIDENCE_SCALE_INTERNAL[level];
}

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel,
): number {
  return CONFIDENCE_SCALE_INTERNAL[a].rank - CONFIDENCE_SCALE_INTERNAL[b].rank;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskRating = "low" | "moderate" | "high" | "extreme";

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  rating: RiskRating;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskMatrixCell>>;

const LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];

function assertLevel(name: string, value: number): asserts value is LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${name} must be an integer between 1 and 5`);
  }
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  assertLevel("likelihood", likelihood);
  assertLevel("impact", impact);
  return likelihood * impact;
}

const RISK_RATINGS: { rating: RiskRating; maxScore: number }[] = [
  { rating: "low", maxScore: 4 },
  { rating: "moderate", maxScore: 9 },
  { rating: "high", maxScore: 16 },
  { rating: "extreme", maxScore: 25 },
];

export function classifyRisk(score: number): RiskRating {
  if (!Number.isFinite(score) || score < 1 || score > 25) {
    throw new Error("Risk score must be between 1 and 25");
  }
  const found = RISK_RATINGS.find((tier) => score <= tier.maxScore);
  if (!found) {
    return "extreme";
  }
  return found.rating;
}

export function buildRiskMatrix(): RiskMatrix {
  const rows: RiskMatrixCell[][] = [];
  for (const likelihood of LEVELS) {
    const row: RiskMatrixCell[] = [];
    for (const impact of LEVELS) {
      const score = calculateRiskScore(likelihood, impact);
      row.push({
        likelihood,
        impact,
        score,
        rating: classifyRisk(score),
      });
    }
    rows.push(row);
  }
  return rows;
}

export interface ActionItem {
  id: string;
  owner: string;
  action: string;
  deadline: string;
  status: "pending" | "completed";
}

let actionCounter = 0;

function normalizeDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid date string");
  }
  return date.toISOString();
}

function requireNonEmpty(field: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} cannot be empty`);
  }
  return trimmed;
}

function generateActionItemId(): string {
  actionCounter += 1;
  return `action-${Date.now().toString(36)}-${actionCounter.toString(36)}`;
}

export function createActionItem(input: {
  owner: string;
  action: string;
  deadline: string;
}): ActionItem {
  const owner = requireNonEmpty("owner", input.owner);
  const action = requireNonEmpty("action", input.action);
  const deadline = normalizeDeadline(input.deadline);

  return {
    id: generateActionItemId(),
    owner,
    action,
    deadline,
    status: "pending",
  };
}

export function completeActionItem(item: ActionItem): ActionItem {
  return {
    ...item,
    status: "completed",
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("action item deadline is invalid");
  }
  return item.status === "pending" && deadline.getTime() < referenceDate.getTime();
}
