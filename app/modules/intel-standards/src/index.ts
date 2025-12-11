export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  summary: string;
  guidance: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  definition: string;
  narrativeCue: string;
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export type RiskLevel = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: Likelihood;
  impact: Impact;
  score: number;
  level: RiskLevel;
}

export type RiskMatrix = RiskCell[][];

export type ActionItemStatus = "pending" | "in-progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

export interface CreateActionItemInput {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}

const SOURCE_RELIABILITY_SUMMARIES: Record<SourceReliabilityGrade, SourceReliabilityDescriptor> = {
  A: {
    grade: "A",
    summary: "Completely reliable",
    guidance: "Consistently validated against trusted holdings; presume accuracy.",
  },
  B: {
    grade: "B",
    summary: "Usually reliable",
    guidance: "Minor discrepancies historically; verify when high impact decisions.",
  },
  C: {
    grade: "C",
    summary: "Fairly reliable",
    guidance: "Mixed validation history; require corroboration before acting.",
  },
  D: {
    grade: "D",
    summary: "Not usually reliable",
    guidance: "Significant contradictions reported; treat as weak signal.",
  },
  E: {
    grade: "E",
    summary: "Unreliable",
    guidance: "Known bias or deception risk; rely only for contextual awareness.",
  },
  F: {
    grade: "F",
    summary: "Reliability cannot be judged",
    guidance: "Insufficient reporting history; treat as anonymous tip requiring validation.",
  },
};

export const sourceReliabilityScale = SOURCE_RELIABILITY_SUMMARIES;

export function describeSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SUMMARIES[grade];
}

const CONFIDENCE_DESCRIPTORS: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    definition: "Strong analytic line supported by high-quality, consistent evidence.",
    narrativeCue: "We assess with high confidence that ...",
  },
  moderate: {
    level: "moderate",
    definition: "Credible information with some gaps or competing hypotheses.",
    narrativeCue: "We assess with moderate confidence that ...",
  },
  low: {
    level: "low",
    definition: "Sparse or questionable information; judgments are provisional.",
    narrativeCue: "We assess with low confidence that ...",
  },
};

export const confidenceScale = CONFIDENCE_DESCRIPTORS;

export function describeConfidence(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_DESCRIPTORS[level];
}

const RISK_LEVEL_THRESHOLDS: Array<{
  maxScore: number;
  level: RiskLevel;
}> = [
  { maxScore: 4, level: "minimal" },
  { maxScore: 9, level: "low" },
  { maxScore: 14, level: "moderate" },
  { maxScore: 19, level: "high" },
  { maxScore: 25, level: "critical" },
];

export function computeRiskScore(
  likelihood: Likelihood,
  impact: Impact,
): number {
  return likelihood * impact;
}

export function deriveRiskLevel(score: number): RiskLevel {
  const threshold = RISK_LEVEL_THRESHOLDS.find((entry) => score <= entry.maxScore);
  return threshold ? threshold.level : "critical";
}

export function getRiskCell(
  likelihood: Likelihood,
  impact: Impact,
): RiskCell {
  const score = computeRiskScore(likelihood, impact);
  return {
    likelihood,
    impact,
    score,
    level: deriveRiskLevel(score),
  };
}

function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihoodValue = 1; likelihoodValue <= 5; likelihoodValue++) {
    const likelihood = likelihoodValue as Likelihood;
    const row: RiskCell[] = [];
    for (let impactValue = 1; impactValue <= 5; impactValue++) {
      const impact = impactValue as Impact;
      row.push(getRiskCell(likelihood, impact));
    }
    matrix.push(row);
  }

  return matrix;
}

export const riskMatrix = buildRiskMatrix();

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be provided`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }
  return date.toISOString();
}

export function createActionItem(input: CreateActionItemInput): ActionItem {
  const description = assertNonEmpty(input.description, "description");
  const owner = assertNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  return {
    description,
    owner,
    deadline,
    status,
  };
}
