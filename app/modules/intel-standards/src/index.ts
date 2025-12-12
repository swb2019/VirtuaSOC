export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_GRADES: SourceReliabilityGrade[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

const SOURCE_RELIABILITY_SCALE: Record<SourceReliabilityGrade, SourceReliabilityDescriptor> = {
  A: {
    grade: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, trustworthiness, or competency.",
  },
  B: {
    grade: "B",
    label: "Usually reliable",
    description: "Minor doubt about authenticity, trustworthiness, or competency.",
  },
  C: {
    grade: "C",
    label: "Fairly reliable",
    description: "Doubt exists about authenticity, trustworthiness, or competency.",
  },
  D: {
    grade: "D",
    label: "Not usually reliable",
    description: "Significant doubt about authenticity, trustworthiness, or competency.",
  },
  E: {
    grade: "E",
    label: "Unreliable",
    description: "Major doubt; authenticity, trustworthiness, or competency is unproven.",
  },
  F: {
    grade: "F",
    label: "Cannot be judged",
    description: "Insufficient information to evaluate reliability.",
  },
};

export function describeSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityDescriptor {
  const descriptor = SOURCE_RELIABILITY_SCALE[grade];
  if (!descriptor) {
    throw new Error(`Unknown source reliability grade: ${grade as string}`);
  }
  return descriptor;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  severity: RiskSeverity;
}

export type RiskMatrix = RiskScore[][]; // 5x5 grid

const RISK_SEVERITY_THRESHOLDS: { max: number; severity: RiskSeverity }[] = [
  { max: 4, severity: "minimal" },
  { max: 9, severity: "low" },
  { max: 14, severity: "moderate" },
  { max: 19, severity: "high" },
  { max: 25, severity: "critical" },
];

function assertLevel(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${name} must be between 1 and 5. Received: ${value}`);
  }
}

function deriveSeverity(score: number): RiskSeverity {
  for (const bucket of RISK_SEVERITY_THRESHOLDS) {
    if (score <= bucket.max) {
      return bucket.severity;
    }
  }
  // Should never happen because 5x5 => max 25
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLevel("Likelihood", likelihood);
  assertLevel("Impact", impact);

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    severity: deriveSeverity(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact++) {
      row.push(
        calculateRiskScore(
          likelihood as LikelihoodLevel,
          impact as ImpactLevel,
        ),
      );
    }
    matrix.push(row);
  }
  return matrix;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = input.description?.trim();
  if (!description) {
    throw new Error("Action item description is required.");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("Action item owner is required.");
  }

  const deadlineIso = normalizeIsoDate(input.deadline);

  return {
    description,
    owner,
    deadline: deadlineIso,
  };
}

function normalizeIsoDate(value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Action item deadline must be a non-empty ISO string.");
  }

  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    throw new Error(`Invalid ISO 8601 deadline: ${value}`);
  }

  return asDate.toISOString();
}
