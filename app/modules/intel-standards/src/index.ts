export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<SourceReliability, SourceReliabilityDescriptor> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, trustworthiness, or competence; has a history of complete reliability.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts exist; has a history of mostly reliable reporting.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Doubts exist but has provided sufficient credible information in the past.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt; has not consistently provided reliable information.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Authenticity, trustworthiness, and competence are questionable.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "Insufficient basis exists to evaluate reliability (new or untested source).",
  },
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    description:
      "Information is credibly sourced, corroborated, and consistent with analytic judgments.",
  },
  moderate: {
    level: "moderate",
    description:
      "Information is plausible and partially corroborated but may conflict with other data or lack detail.",
  },
  low: {
    level: "low",
    description:
      "Information credibility is questionable or too fragmented/uncorroborated to support confident judgments.",
  },
};

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  score: number; // 1-25
  severity: RiskSeverity;
}

export type RiskMatrix = RiskScore[][]; // 5 rows x 5 columns

const RISK_THRESHOLDS: Array<{ max: number; severity: RiskSeverity }> = [
  { max: 4, severity: "very_low" },
  { max: 9, severity: "low" },
  { max: 15, severity: "moderate" },
  { max: 20, severity: "high" },
  { max: 25, severity: "critical" },
];

function resolveRiskSeverity(score: number): RiskSeverity {
  const bucket = RISK_THRESHOLDS.find((threshold) => score <= threshold.max);
  return bucket ? bucket.severity : "critical";
}

function assertScoreWithinBounds(value: number, label: string): asserts value is LikelihoodScore & ImpactScore {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5`);
  }
}

export function calculateRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
): RiskScore {
  assertScoreWithinBounds(likelihood, "likelihood");
  assertScoreWithinBounds(impact, "impact");

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    severity: resolveRiskSeverity(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push(
        calculateRiskScore(likelihood as LikelihoodScore, impact as ImpactScore),
      );
    }
    rows.push(row);
  }
  return rows;
}

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601 UTC
  status: ActionItemStatus;
}

function normalizeDeadline(deadline: string | Date): string {
  if (typeof deadline === "string" && deadline.trim().length === 0) {
    throw new Error("deadline is required");
  }

  const date =
    deadline instanceof Date
      ? deadline
      : new Date(deadline.trim());

  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid date or ISO-8601 string");
  }

  return date.toISOString();
}

function normalizeNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem {
  const action = normalizeNonEmpty(input.action, "action");
  const owner = normalizeNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status: ActionItemStatus = input.status ?? "pending";

  return { action, owner, deadline, status };
}
