export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  classification: "low" | "guarded" | "moderate" | "high" | "critical";
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
}

const SOURCE_RELIABILITY_MAP: Record<SourceReliabilityGrade, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

const CONFIDENCE_MAP: Record<ConfidenceLevel, string> = {
  high: "High confidence: well-corroborated, quality sourcing.",
  moderate: "Moderate confidence: plausible but not confirmed.",
  low: "Low confidence: sparse, questionable, or contradictory evidence.",
};

const LIKELIHOOD_VALUES: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_VALUES: ImpactLevel[] = [1, 2, 3, 4, 5];

const RISK_CLASSIFICATION_BOUNDS: {
  maxScore: number;
  classification: RiskScore["classification"];
}[] = [
  { maxScore: 5, classification: "low" },
  { maxScore: 10, classification: "guarded" },
  { maxScore: 15, classification: "moderate" },
  { maxScore: 20, classification: "high" },
  { maxScore: 25, classification: "critical" },
];

function assertSourceReliabilityGrade(
  grade: SourceReliabilityGrade,
): asserts grade is SourceReliabilityGrade {
  if (!(grade in SOURCE_RELIABILITY_MAP)) {
    throw new Error(`Unknown source reliability grade: ${grade}`);
  }
}

function assertConfidenceLevel(
  level: ConfidenceLevel,
): asserts level is ConfidenceLevel {
  if (!(level in CONFIDENCE_MAP)) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
}

function assertLikelihood(value: number): asserts value is LikelihoodLevel {
  if (!LIKELIHOOD_VALUES.includes(value as LikelihoodLevel)) {
    throw new Error(`Likelihood must be 1-5. Received ${value}`);
  }
}

function assertImpact(value: number): asserts value is ImpactLevel {
  if (!IMPACT_VALUES.includes(value as ImpactLevel)) {
    throw new Error(`Impact must be 1-5. Received ${value}`);
  }
}

function classifyRiskScore(score: number): RiskScore["classification"] {
  const bucket = RISK_CLASSIFICATION_BOUNDS.find(
    (entry) => score <= entry.maxScore,
  );
  if (!bucket) {
    throw new Error(`Risk score out of range: ${score}`);
  }
  return bucket.classification;
}

function isIsoString(value: string): boolean {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.toISOString() === value;
}

export function describeSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityDescriptor {
  assertSourceReliabilityGrade(grade);
  return {
    grade,
    description: SOURCE_RELIABILITY_MAP[grade],
  };
}

export function describeConfidence(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  assertConfidenceLevel(level);
  return {
    level,
    description: CONFIDENCE_MAP[level],
  };
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLikelihood(likelihood);
  assertImpact(impact);

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    classification: classifyRiskScore(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_VALUES.map((likelihood) =>
    IMPACT_VALUES.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const action = input.action?.trim();
  const owner = input.owner?.trim();
  const deadline = input.deadline?.trim();

  if (!action) {
    throw new Error("Action description is required");
  }
  if (!owner) {
    throw new Error("Owner is required");
  }
  if (!deadline || !isIsoString(deadline)) {
    throw new Error(
      "Deadline must be an ISO 8601 string (e.g. 2025-01-01T00:00:00.000Z)",
    );
  }

  return {
    action,
    owner,
    deadline,
  };
}
