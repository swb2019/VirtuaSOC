export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  grade: SourceReliabilityGrade;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityEntry[] = [
  {
    grade: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, veracity, or competence.",
  },
  {
    grade: "B",
    label: "Usually reliable",
    description: "Minor doubt based on small variances or limited history.",
  },
  {
    grade: "C",
    label: "Fairly reliable",
    description: "Doubts stemming from occasional inconsistencies or gaps.",
  },
  {
    grade: "D",
    label: "Not usually reliable",
    description: "Significant doubt; prior reporting frequently inaccurate.",
  },
  {
    grade: "E",
    label: "Unreliable",
    description: "Authenticity or veracity cannot be judged; contradictory history.",
  },
  {
    grade: "F",
    label: "Reliability unknown",
    description: "Insufficient data to assess; first-time or unvetted source.",
  },
] as const;

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceLevelEntry {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_LEVELS: readonly ConfidenceLevelEntry[] = [
  {
    level: "high",
    description:
      "Judgments supported by multiple independent, corroborated sources.",
  },
  {
    level: "moderate",
    description: "Credible information with some corroboration gaps remaining.",
  },
  {
    level: "low",
    description:
      "Significant information gaps or conflicting reporting undermine certainty.",
  },
] as const;

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  severity: RiskSeverity;
}

export type RiskMatrix = RiskCell[][];

export type ActionStatus = "pending" | "in-progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

const SEVERITY_THRESHOLDS: { upperBound: number; severity: RiskSeverity }[] = [
  { upperBound: 5, severity: "minimal" },
  { upperBound: 10, severity: "low" },
  { upperBound: 15, severity: "moderate" },
  { upperBound: 20, severity: "high" },
  { upperBound: 25, severity: "critical" },
];

function assertGrade(value: string): asserts value is SourceReliabilityGrade {
  if (!SOURCE_RELIABILITY_SCALE.some((entry) => entry.grade === value)) {
    throw new Error(`Unsupported source reliability grade: ${value}`);
  }
}

function assertConfidence(value: string): asserts value is ConfidenceLevel {
  if (!CONFIDENCE_LEVELS.some((entry) => entry.level === value)) {
    throw new Error(`Unsupported confidence level: ${value}`);
  }
}

function assertRange(
  value: number,
  label: "likelihood" | "impact",
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5`);
  }
}

function resolveSeverity(score: number): RiskSeverity {
  const bucket = SEVERITY_THRESHOLDS.find((threshold) => score <= threshold.upperBound);
  if (!bucket) {
    throw new Error(`Risk score out of range: ${score}`);
  }
  return bucket.severity;
}

function normalizeDeadline(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid deadline date: ${input}`);
  }
  return date.toISOString();
}

export function getSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityEntry {
  assertGrade(grade);
  return SOURCE_RELIABILITY_SCALE.find((entry) => entry.grade === grade)!;
}

export function getConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceLevelEntry {
  assertConfidence(level);
  return CONFIDENCE_LEVELS.find((entry) => entry.level === level)!;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskCell {
  assertRange(likelihood, "likelihood");
  assertRange(impact, "impact");
  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    severity: resolveSeverity(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskCell[][] = [];
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const typedLikelihood = likelihood as LikelihoodLevel;
    const row: RiskCell[] = [];
    for (let impact = 1; impact <= 5; impact++) {
      const typedImpact = impact as ImpactLevel;
      row.push(calculateRiskScore(typedLikelihood, typedImpact));
    }
    matrix.push(row);
  }
  return matrix;
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const description = input.description?.trim();
  const owner = input.owner?.trim();
  if (!description) {
    throw new Error("Action description is required");
  }
  if (!owner) {
    throw new Error("Action owner is required");
  }
  const deadline = normalizeDeadline(input.deadline);
  return {
    description,
    owner,
    deadline,
    status: input.status ?? "pending",
  };
}
