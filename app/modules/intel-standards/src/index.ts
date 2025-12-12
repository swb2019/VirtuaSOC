export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export type ActionItemStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  high: "High confidence: solid corroboration and consistency",
  moderate: "Moderate confidence: information is plausible but incomplete",
  low: "Low confidence: significant doubts or conflicting data",
};

const LIKELIHOOD_LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: ImpactLevel[] = [1, 2, 3, 4, 5];

function deriveRiskBand(score: number): RiskBand {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 19) {
    return "high";
  }
  return "critical";
}

function assertIsoDate(value: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }
}

function normalizeIsoDate(value: string): string {
  return new Date(value).toISOString();
}

export function describeSourceReliability(value: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[value];
}

export function describeConfidence(value: ConfidenceLevel): string {
  return CONFIDENCE_DESCRIPTIONS[value];
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    band: deriveRiskBand(score),
  };
}

const buildRiskMatrix = (): RiskMatrix =>
  LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) =>
      Object.freeze(
        calculateRiskScore(likelihood, impact),
      ),
    ) as ReadonlyArray<RiskScore>,
  ) as RiskMatrix;

export const RISK_MATRIX: RiskMatrix = Object.freeze(
  buildRiskMatrix().map((row) => Object.freeze(row)) as RiskMatrix,
);

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const description = input.description.trim();
  if (!description) {
    throw new Error("description is required");
  }

  const owner = input.owner.trim();
  if (!owner) {
    throw new Error("owner is required");
  }

  const deadline = input.deadline.trim();
  if (!deadline) {
    throw new Error("deadline is required");
  }

  assertIsoDate(deadline);

  const status: ActionItemStatus = input.status ?? "pending";

  return {
    description,
    owner,
    deadline: normalizeIsoDate(deadline),
    status,
  };
}
