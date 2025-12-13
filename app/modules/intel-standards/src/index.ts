export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliability {
  code: SourceReliabilityCode;
  description: string;
}

export interface SourceReliabilityDescriptor extends SourceReliability {}

const SOURCE_RELIABILITY_MAP: Record<SourceReliabilityCode, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[] = (
  Object.entries(SOURCE_RELIABILITY_MAP) as [
    SourceReliabilityCode,
    string,
  ][]
).map(([code, description]) => ({
  code,
  description,
}));

function normalizeSourceReliabilityCode(code: string): SourceReliabilityCode {
  const normalized = code.trim().toUpperCase();
  if (!normalized || !(normalized in SOURCE_RELIABILITY_MAP)) {
    throw new Error(`Invalid source reliability code: ${code}`);
  }
  return normalized as SourceReliabilityCode;
}

export function createSourceReliability(code: string): SourceReliability {
  const normalized = normalizeSourceReliabilityCode(code);
  return {
    code: normalized,
    description: SOURCE_RELIABILITY_MAP[normalized],
  };
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_MAP: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
};

export const CONFIDENCE_SCALE: readonly ConfidenceDescriptor[] = (
  Object.entries(CONFIDENCE_MAP) as [ConfidenceLevel, string][]
).map(([level, description]) => ({
  level,
  description,
}));

function normalizeConfidenceLevel(level: string): ConfidenceLevel {
  const normalized = level.trim().toLowerCase();
  if (!normalized || !(normalized in CONFIDENCE_MAP)) {
    throw new Error(`Invalid confidence level: ${level}`);
  }
  return normalized as ConfidenceLevel;
}

export function createConfidence(level: string): ConfidenceDescriptor {
  const normalized = normalizeConfidenceLevel(level);
  return {
    level: normalized,
    description: CONFIDENCE_MAP[normalized],
  };
}

export type RiskAxisValue = 1 | 2 | 3 | 4 | 5;
export type RiskSeverity = "low" | "moderate" | "high" | "critical";

export interface RiskAssessment {
  likelihood: RiskAxisValue;
  impact: RiskAxisValue;
  riskScore: number;
  severity: RiskSeverity;
}

function assertAxisValue(value: number, axis: "likelihood" | "impact"): asserts value is RiskAxisValue {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${axis} must be an integer between 1 and 5`);
  }
}

function severityForScore(score: number): RiskSeverity {
  if (score <= 5) {
    return "low";
  }
  if (score <= 10) {
    return "moderate";
  }
  if (score <= 15) {
    return "high";
  }
  return "critical";
}

export function createRiskAssessment(input: {
  likelihood: number;
  impact: number;
}): RiskAssessment {
  assertAxisValue(input.likelihood, "likelihood");
  assertAxisValue(input.impact, "impact");
  const riskScore = input.likelihood * input.impact;
  return {
    likelihood: input.likelihood,
    impact: input.impact,
    riskScore,
    severity: severityForScore(riskScore),
  };
}

export interface ActionItem {
  owner: string;
  action: string;
  deadline: string; // ISO 8601
}

function ensureNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be provided`);
  }
  return trimmed;
}

function normalizeDeadline(input: string): string {
  const trimmed = input.trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`deadline must be a valid date string`);
  }
  return date.toISOString();
}

export function createActionItem(input: {
  owner: string;
  action: string;
  deadline: string;
}): ActionItem {
  const owner = ensureNonEmpty(input.owner, "owner");
  const action = ensureNonEmpty(input.action, "action");
  const deadline = normalizeDeadline(input.deadline);
  return {
    owner,
    action,
    deadline,
  };
}
