export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "Confirmed by independent sources; history of accuracy.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts; generally consistent reporting track record.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Questionable sourcing or mixed history requiring corroboration.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Frequent inconsistencies or agendas observed; heavy vetting required.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Previous reporting proven false or impossible to validate.",
  },
  F: {
    code: "F",
    label: "Reliability cannot be judged",
    description: "New or unknown source; insufficient history for confidence.",
  },
} as const;

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_DESCRIPTORS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    description:
      "Judgment holds absent major new contradictory information; evidence is strong.",
  },
  moderate: {
    level: "moderate",
    description:
      "Judgment is credible but sensitive to new reporting; evidence is mixed.",
  },
  low: {
    level: "low",
    description:
      "Judgment is speculative; relies on sparse or low-confidence reporting.",
  },
} as const;

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

const SCORE_RANGE = [1, 2, 3, 4, 5] as const satisfies readonly number[];

export interface RiskCell {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  score: number;
}

export type RiskMatrix = RiskCell[][]; // always 5 x 5

function assertScore(name: string, value: number): asserts value is LikelihoodScore {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${name} must be an integer between 1 and 5.`);
  }
}

export function deriveRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
): number {
  assertScore("likelihood", likelihood);
  assertScore("impact", impact);
  return likelihood * impact;
}

export function createRiskMatrix(): RiskMatrix {
  return SCORE_RANGE.map((likelihood) =>
    SCORE_RANGE.map((impact) => ({
      likelihood: likelihood as LikelihoodScore,
      impact: impact as ImpactScore,
      score: deriveRiskScore(
        likelihood as LikelihoodScore,
        impact as ImpactScore,
      ),
    })),
  );
}

export type ActionStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionStatus;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) {
      throw new Error("deadline date is invalid");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("deadline cannot be empty");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 string");
  }
  return parsed.toISOString();
}

function assertNonEmpty(field: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionStatus;
}): ActionItem {
  const description = assertNonEmpty("description", input.description);
  const owner = assertNonEmpty("owner", input.owner);
  const isoDeadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  const item: ActionItem = Object.freeze({
    description,
    owner,
    deadline: isoDeadline,
    status,
  });

  return item;
}
