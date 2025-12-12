export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "Confirmed history of accuracy; no doubt about authenticity.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts or limited issues, but generally dependable.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Questionable accuracy; requires corroboration.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Significant concerns or unverified claims.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Known to be inaccurate or deceptive.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "Insufficient data to assess reliability.",
  },
};

export function getSourceReliability(
  code: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    label: "High confidence",
    description:
      "Strong analytic judgment supported by high-quality sources and rigorous corroboration.",
  },
  moderate: {
    level: "moderate",
    label: "Moderate confidence",
    description:
      "Information credibly sourced but limited in quantity or corroboration.",
  },
  low: {
    level: "low",
    label: "Low confidence",
    description:
      "Significant information gaps or questionable sourcing; requires confirmation.",
  },
};

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_SCALE[level];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskClassification =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  classification: RiskClassification;
}

function assertFivePointLevel(
  value: number,
  field: "likelihood" | "impact",
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${field} must be an integer between 1 and 5`);
  }
}

function classifyRisk(score: number): RiskClassification {
  if (score <= 5) return "minimal";
  if (score <= 10) return "low";
  if (score <= 15) return "moderate";
  if (score <= 20) return "high";
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertFivePointLevel(likelihood, "likelihood");
  assertFivePointLevel(impact, "impact");

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    classification: classifyRisk(score),
  };
}

export type RiskMatrix = RiskScore[][];

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihood = 1 as LikelihoodLevel; likelihood <= 5; likelihood++) {
    const row: RiskScore[] = [];
    for (let impact = 1 as ImpactLevel; impact <= 5; impact++) {
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
  deadline: string; // ISO 8601
}

interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string;
}

function normalizeText(value: string, field: "description" | "owner"): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("deadline is required");
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date string");
  }
  return date.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const normalized: ActionItem = {
    description: normalizeText(input.description, "description"),
    owner: normalizeText(input.owner, "owner"),
    deadline: normalizeDeadline(input.deadline),
  };
  return Object.freeze(normalized);
}

export const SOURCE_RELIABILITY_ENTRIES: SourceReliabilityDescriptor[] =
  Object.values(SOURCE_RELIABILITY_SCALE);

export const CONFIDENCE_ENTRIES: ConfidenceDescriptor[] =
  Object.values(CONFIDENCE_SCALE);
