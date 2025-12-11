export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityInfo {
  grade: SourceReliabilityGrade;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceInfo {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = LikelihoodLevel;

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

export interface RiskMatrixRow {
  likelihood: LikelihoodLevel;
  entries: RiskScore[];
}

export type RiskMatrix = RiskMatrixRow[];

export type ActionItemStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

export interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliabilityGrade,
  string
> = {
  A: "Completely reliable source",
  B: "Usually reliable source",
  C: "Fairly reliable source",
  D: "Not usually reliable source",
  E: "Unreliable source",
  F: "Reliability cannot be judged",
};

const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  high: "High confidence: evidence strongly supports the judgment",
  moderate: "Moderate confidence: information is credible but not conclusive",
  low: "Low confidence: information is scant, questionable, or fragmented",
};

const RISK_SEVERITY_BUCKETS: Array<{
  maxScore: number;
  severity: RiskSeverity;
}> = [
  { maxScore: 4, severity: "minimal" },
  { maxScore: 8, severity: "low" },
  { maxScore: 12, severity: "moderate" },
  { maxScore: 20, severity: "high" },
  { maxScore: 25, severity: "critical" },
];

export function describeSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityInfo {
  return { grade, description: SOURCE_RELIABILITY_DESCRIPTIONS[grade] };
}

export function describeConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceInfo {
  return { level, description: CONFIDENCE_DESCRIPTIONS[level] };
}

function assertRange(
  value: number,
  field: "likelihood" | "impact",
): asserts value is LikelihoodLevel {
  if (value < 1 || value > 5 || !Number.isInteger(value)) {
    throw new RangeError(`${field} must be an integer between 1 and 5`);
  }
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertRange(likelihood, "likelihood");
  assertRange(impact, "impact");

  const score = likelihood * impact;
  const bucket =
    RISK_SEVERITY_BUCKETS.find((entry) => score <= entry.maxScore) ??
    RISK_SEVERITY_BUCKETS[RISK_SEVERITY_BUCKETS.length - 1];

  return {
    likelihood,
    impact,
    score,
    severity: bucket.severity,
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];

  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const entries: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      entries.push(
        calculateRiskScore(
          likelihood as LikelihoodLevel,
          impact as ImpactLevel,
        ),
      );
    }
    rows.push({
      likelihood: likelihood as LikelihoodLevel,
      entries,
    });
  }

  return rows;
}

function normalizeDeadline(input: string | Date): string {
  const date =
    input instanceof Date ? input : new Date(input.toString().trim());

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid action item deadline");
  }

  return date.toISOString();
}

function assertNonEmpty(value: string, field: "description" | "owner") {
  if (value.trim().length === 0) {
    throw new Error(`Action item ${field} is required`);
  }
}

function generateActionItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createActionItem(input: ActionItemInput): ActionItem {
  assertNonEmpty(input.description, "description");
  assertNonEmpty(input.owner, "owner");

  const normalizedDeadline = normalizeDeadline(input.deadline);

  return {
    id: generateActionItemId(),
    description: input.description.trim(),
    owner: input.owner.trim(),
    deadline: normalizedDeadline,
    status: input.status ?? "pending",
  };
}
