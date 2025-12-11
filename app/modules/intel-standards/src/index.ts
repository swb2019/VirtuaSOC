export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface RiskMatrixInput {
  likelihood: number; // integer 1-5
  impact: number; // integer 1-5
}

export type RiskBand =
  | "negligible"
  | "guarded"
  | "elevated"
  | "critical"
  | "catastrophic";

export interface RiskAssessment extends RiskMatrixInput {
  score: number; // likelihood * impact
  band: RiskBand;
}

export interface ActionItem {
  owner: string;
  task: string;
  deadline: string; // ISO 8601
}

export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable source with a proven history of accuracy.",
  B: "Usually reliable source; minor caveats but generally trustworthy.",
  C: "Fairly reliable source; corroboration recommended.",
  D: "Not usually reliable; treat products with caution.",
  E: "Unreliable source; do not act without independent confirmation.",
  F: "Reliability cannot be judged with available information.",
};

export const CONFIDENCE_LEVEL_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  high: "Evidence is strong, internally consistent, and independently confirmed.",
  moderate: "Evidence is mixed or incomplete; additional validation advised.",
  low: "Evidence is weak, conflicting, or largely speculative.",
};

const RELIABILITY_SET = new Set<SourceReliability>([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
]);

const CONFIDENCE_SET = new Set<ConfidenceLevel>(["high", "moderate", "low"]);

const RISK_MIN = 1;
const RISK_MAX = 5;

const RISK_BANDS: Array<{ maxScore: number; band: RiskBand }> = [
  { maxScore: 5, band: "negligible" },
  { maxScore: 10, band: "guarded" },
  { maxScore: 15, band: "elevated" },
  { maxScore: 20, band: "critical" },
  { maxScore: 25, band: "catastrophic" },
];

export function isSourceReliability(value: string): value is SourceReliability {
  return RELIABILITY_SET.has(value as SourceReliability);
}

export function describeSourceReliability(code: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[code];
}

export function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return CONFIDENCE_SET.has(value as ConfidenceLevel);
}

export function describeConfidenceLevel(level: ConfidenceLevel): string {
  return CONFIDENCE_LEVEL_DESCRIPTIONS[level];
}

export function evaluateRiskMatrix(input: RiskMatrixInput): RiskAssessment {
  const likelihood = assertCoordinate("likelihood", input.likelihood);
  const impact = assertCoordinate("impact", input.impact);
  const score = likelihood * impact;
  const band = deriveRiskBand(score);

  return {
    likelihood,
    impact,
    score,
    band,
  };
}

export function createActionItem(input: {
  owner: string;
  task: string;
  deadline: string;
}): ActionItem {
  const owner = input.owner.trim();
  const task = input.task.trim();
  const deadline = input.deadline.trim();

  if (owner.length === 0) {
    throw new Error("ActionItem owner is required");
  }

  if (task.length === 0) {
    throw new Error("ActionItem task is required");
  }

  if (!isIso8601(deadline)) {
    throw new Error("ActionItem deadline must be ISO 8601");
  }

  return { owner, task, deadline };
}

function assertCoordinate(name: keyof RiskMatrixInput, value: number): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }

  if (value < RISK_MIN || value > RISK_MAX) {
    throw new Error(`${name} must be between ${RISK_MIN} and ${RISK_MAX}`);
  }

  return value;
}

function deriveRiskBand(score: number): RiskBand {
  const band = RISK_BANDS.find((entry) => score <= entry.maxScore);
  if (!band) {
    // Should be impossible because score max is 25, but guard anyway.
    throw new Error("Score out of supported risk range");
  }
  return band.band;
}

function isIso8601(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.toISOString() === value;
}
