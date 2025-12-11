export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliabilityCode, SourceReliabilityDescriptor>
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description:
      "History of complete reliability with confirmed independent sources.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts; information confirmed in most cases.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description:
      "Doubts exist; supplied information has been mostly confirmed in the past.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description:
      "Significant reservations; prior reporting often conflicted with other sources.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "History of inaccuracy; information is rarely confirmed.",
  },
  F: {
    code: "F",
    label: "Reliability unknown",
    description: "Insufficient reporting history to judge reliability.",
  },
} as const;

export function getSourceReliabilityInfo(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Readonly<
  Record<ConfidenceLevel, ConfidenceDescriptor>
> = {
  high: {
    level: "high",
    description:
      "Strong evidence and agreement; judgments unlikely to change absent major new data.",
  },
  moderate: {
    level: "moderate",
    description:
      "Information is credibly sourced but contains gaps or conflicting views.",
  },
  low: {
    level: "low",
    description:
      "Scant, questionable, or fragmented data; judgments are provisional.",
  },
} as const;

export function getConfidenceInfo(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_SCALE[level];
}

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  value: number;
  category: RiskCategory;
}

export type RiskMatrixRow = ReadonlyArray<RiskScore>;
export type RiskMatrix = ReadonlyArray<RiskMatrixRow>;

const RISK_CATEGORY_THRESHOLDS: ReadonlyArray<{
  maxValue: number;
  category: RiskCategory;
}> = [
  { maxValue: 5, category: "low" },
  { maxValue: 10, category: "moderate" },
  { maxValue: 15, category: "high" },
  { maxValue: 25, category: "critical" },
] as const;

function categorizeRisk(value: number): RiskCategory {
  const bucket =
    RISK_CATEGORY_THRESHOLDS.find((threshold) => value <= threshold.maxValue) ??
    RISK_CATEGORY_THRESHOLDS[RISK_CATEGORY_THRESHOLDS.length - 1];
  return bucket.category;
}

export function computeRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
): RiskScore {
  const riskValue = likelihood * impact;
  return {
    likelihood,
    impact,
    value: riskValue,
    category: categorizeRisk(riskValue),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskScore[][] = [];

  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push(
        computeRiskScore(
          likelihood as LikelihoodScore,
          impact as ImpactScore,
        ),
      );
    }
    matrix.push(row);
  }

  return matrix;
}

export type ActionStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) {
      throw new Error("Deadline must be a valid date");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("Deadline is required");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Deadline must be a valid ISO 8601 string");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionStatus;
}): ActionItem {
  return {
    action: requireNonEmpty(input.action, "Action"),
    owner: requireNonEmpty(input.owner, "Owner"),
    deadline: normalizeDeadline(input.deadline),
    status: input.status ?? "pending",
  };
}
