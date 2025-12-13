export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliability {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<SourceReliabilityCode, SourceReliability> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "History of complete reliability with independently confirmed reporting.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts; reporting is consistently confirmed and timely.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Doubtful or mixed track record; information sometimes confirmed.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubts; past reporting often unconfirmed or contradictory.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "History indicates reporting is false or misleading.",
  },
  F: {
    code: "F",
    label: "Reliability cannot be judged",
    description: "No prior history; insufficient data to evaluate reliability.",
  },
};

export const SOURCE_RELIABILITY_CODES: SourceReliabilityCode[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

export function getSourceReliability(code: SourceReliabilityCode): SourceReliability {
  const entry = SOURCE_RELIABILITY_SCALE[code];
  if (!entry) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }
  return entry;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceMetadata {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceMetadata> = {
  high: {
    level: "high",
    description: "Judgments rest on high-quality information with solid analytic agreement.",
  },
  moderate: {
    level: "moderate",
    description: "Information has gaps or competing interpretations but leans one way.",
  },
  low: {
    level: "low",
    description: "Information is scant, questionable, or highly contested.",
  },
};

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "moderate", "low"];

export function getConfidence(level: ConfidenceLevel): ConfidenceMetadata {
  const entry = CONFIDENCE_SCALE[level];
  if (!entry) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
  return entry;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  band: RiskBand;
}

const RISK_BAND_THRESHOLDS: { max: number; band: RiskBand }[] = [
  { max: 5, band: "low" },
  { max: 12, band: "moderate" },
  { max: 20, band: "high" },
  { max: 25, band: "critical" },
];

function determineRiskBand(value: number): RiskBand {
  const bucket = RISK_BAND_THRESHOLDS.find((entry) => value <= entry.max);
  if (!bucket) {
    // Given the constraints (5x5 matrix), value should never exceed 25.
    throw new Error(`Risk score ${value} exceeds supported range`);
  }
  return bucket.band;
}

function ensureMatrixLevel(value: number, field: string): LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${field} must be an integer between 1 and 5.`);
  }
  return value as LikelihoodLevel;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const normalizedLikelihood = ensureMatrixLevel(likelihood, "likelihood");
  const normalizedImpact = ensureMatrixLevel(impact, "impact") as ImpactLevel;
  const value = normalizedLikelihood * normalizedImpact;
  return {
    likelihood: normalizedLikelihood,
    impact: normalizedImpact,
    value,
    band: determineRiskBand(value),
  };
}

export function buildRiskMatrix(): RiskScore[][] {
  const rows: RiskScore[][] = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push(
        calculateRiskScore(
          likelihood as LikelihoodLevel,
          impact as ImpactLevel,
        ),
      );
    }
    rows.push(row);
  }
  return rows;
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string;
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const summary = normalizeRequiredText(input.summary, "summary");
  const owner = normalizeRequiredText(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  return { summary, owner, deadline };
}

function normalizeRequiredText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
}

function normalizeDeadline(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("deadline is required.");
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid date or ISO 8601 string.");
  }
  return date.toISOString();
}
