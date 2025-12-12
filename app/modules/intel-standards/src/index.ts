export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  label: string;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
}

export type RiskMatrix = RiskCell[][];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date string
  status: "pending" | "in_progress" | "completed";
}

const SOURCE_RELIABILITY_SCALE_MAP = {
  A: {
    label: "A — Completely reliable",
    description: "History of complete reliability; no doubt about the source.",
  },
  B: {
    label: "B — Usually reliable",
    description: "Minor doubts; source has proven reliable in most cases.",
  },
  C: {
    label: "C — Fairly reliable",
    description: "Reasonable doubts; source has shown mixed results.",
  },
  D: {
    label: "D — Not usually reliable",
    description: "Significant doubts; source often inaccurate or biased.",
  },
  E: {
    label: "E — Unreliable",
    description: "Strong evidence source cannot be relied on.",
  },
  F: {
    label: "F — Reliability cannot be judged",
    description: "Insufficient information exists to rate the source.",
  },
} as const satisfies Record<SourceReliability, SourceReliabilityDescriptor>;

const CONFIDENCE_LEVELS_MAP = {
  high: {
    label: "High confidence",
    description: "Judgment is well-supported; further information unlikely to change it.",
  },
  moderate: {
    label: "Moderate confidence",
    description:
      "Credible information exists but the judgment may change with new data.",
  },
  low: {
    label: "Low confidence",
    description: "Information is scant, questionable, or too fragmented to rely on.",
  },
} as const satisfies Record<ConfidenceLevel, ConfidenceDescriptor>;

const LIKELIHOOD_LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: ImpactLevel[] = [1, 2, 3, 4, 5];

function assertLevel(name: string, value: number): asserts value is LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${name} must be an integer between 1 and 5.`);
  }
}

function normalizeDeadline(deadline: string): string {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError("Deadline must be a valid date or ISO string.");
  }
  return parsed.toISOString();
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  assertLevel("Likelihood", likelihood);
  assertLevel("Impact", impact);
  return likelihood * impact;
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => ({
      likelihood,
      impact,
      score: calculateRiskScore(likelihood, impact),
    })),
  );
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItem["status"];
}): ActionItem {
  const description = input.description?.trim();
  if (!description) {
    throw new Error("Action items require a non-empty description.");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("Action items require an owner.");
  }

  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  return {
    description,
    owner,
    deadline,
    status,
  };
}

function coerceReferenceDate(referenceDate?: Date | string): Date {
  if (!referenceDate) {
    return new Date();
  }

  if (referenceDate instanceof Date) {
    return referenceDate;
  }

  const parsed = new Date(referenceDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError("Reference date must be a valid date or ISO string.");
  }
  return parsed;
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean {
  const ref = coerceReferenceDate(referenceDate).getTime();
  const deadlineTime = new Date(item.deadline).getTime();
  if (Number.isNaN(deadlineTime)) {
    throw new RangeError("Action item deadline is invalid.");
  }
  return deadlineTime < ref;
}

export const SOURCE_RELIABILITY_SCALE = SOURCE_RELIABILITY_SCALE_MAP;
export const CONFIDENCE_LEVELS = CONFIDENCE_LEVELS_MAP;
