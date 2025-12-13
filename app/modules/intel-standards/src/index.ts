export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityInfo {
  level: SourceReliability;
  description: string;
}

const SOURCE_RELIABILITY_DEFINITIONS: Record<SourceReliability, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

const SOURCE_RELIABILITY_SET = new Set<SourceReliability>(
  Object.keys(SOURCE_RELIABILITY_DEFINITIONS) as SourceReliability[],
);

export function isSourceReliability(value: unknown): value is SourceReliability {
  if (typeof value !== "string") {
    return false;
  }

  const upper = value.toUpperCase() as SourceReliability;
  return SOURCE_RELIABILITY_SET.has(upper);
}

export function describeSourceReliability(
  level: SourceReliability,
): SourceReliabilityInfo {
  if (!SOURCE_RELIABILITY_SET.has(level)) {
    throw new Error(`Unknown source reliability level: ${level}`);
  }

  return { level, description: SOURCE_RELIABILITY_DEFINITIONS[level] };
}

export type ConfidenceLevel = "high" | "moderate" | "low";

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "moderate", "low"];
const CONFIDENCE_LEVEL_SET = new Set(CONFIDENCE_LEVELS);

export function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return typeof value === "string" && CONFIDENCE_LEVEL_SET.has(value as ConfidenceLevel);
}

export type RiskScaleValue = 1 | 2 | 3 | 4 | 5;
export type RiskCategory = "low" | "moderate" | "high" | "critical";

const RISK_SCALE_VALUES: RiskScaleValue[] = [1, 2, 3, 4, 5];
const RISK_CATEGORY_THRESHOLDS: { max: number; category: RiskCategory }[] = [
  { max: 5, category: "low" },
  { max: 10, category: "moderate" },
  { max: 15, category: "high" },
  { max: 25, category: "critical" },
];

export interface RiskScore {
  value: number;
  category: RiskCategory;
}

export interface RiskMatrixCell {
  likelihood: RiskScaleValue;
  impact: RiskScaleValue;
  score: RiskScore;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskMatrixCell>>;

function assertRiskScaleValue(value: number): asserts value is RiskScaleValue {
  if (!RISK_SCALE_VALUES.includes(value as RiskScaleValue)) {
    throw new Error(`Risk scale value must be between 1 and 5. Received: ${value}`);
  }
}

function categorizeRisk(score: number): RiskCategory {
  const match = RISK_CATEGORY_THRESHOLDS.find((entry) => score <= entry.max);
  if (!match) {
    throw new Error(`Risk score out of range: ${score}`);
  }
  return match.category;
}

export function calculateRiskScore(
  likelihood: RiskScaleValue,
  impact: RiskScaleValue,
): RiskScore {
  assertRiskScaleValue(likelihood);
  assertRiskScaleValue(impact);

  const value = likelihood * impact;
  return {
    value,
    category: categorizeRisk(value),
  };
}

export function generateRiskMatrix(): RiskMatrix {
  return RISK_SCALE_VALUES.map((likelihood) =>
    RISK_SCALE_VALUES.map((impact) => ({
      likelihood,
      impact,
      score: calculateRiskScore(likelihood, impact),
    })),
  );
}

export type ActionStatus = "pending" | "in_progress" | "done";

const ACTION_STATUS_VALUES: ActionStatus[] = ["pending", "in_progress", "done"];
const ACTION_STATUS_SET = new Set(ACTION_STATUS_VALUES);

export interface ActionItem {
  owner: string;
  summary: string;
  deadline: string;
  status: ActionStatus;
}

interface CreateActionItemInput {
  owner: string;
  summary: string;
  deadline: string | Date;
  status?: ActionStatus;
}

function normalizeString(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string | Date): string {
  const date = typeof deadline === "string" ? new Date(deadline) : new Date(deadline.getTime());
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid date");
  }
  return date.toISOString();
}

function normalizeStatus(status?: ActionStatus): ActionStatus {
  if (!status) {
    return "pending";
  }
  if (!ACTION_STATUS_SET.has(status)) {
    throw new Error(`Unsupported action status: ${status}`);
  }
  return status;
}

export function createActionItem(input: CreateActionItemInput): ActionItem {
  const owner = normalizeString(input.owner, "owner");
  const summary = normalizeString(input.summary, "summary");
  const deadline = normalizeDeadline(input.deadline);
  const status = normalizeStatus(input.status);

  return {
    owner,
    summary,
    deadline,
    status,
  };
}
