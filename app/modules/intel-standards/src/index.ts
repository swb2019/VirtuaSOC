export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
  guidance: string;
}

const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityEntry
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "History of complete reliability and validated sourcing.",
    guidance: "Treat as authoritative but still corroborate when practical.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Minor lapses only; strong track record with occasional gaps.",
    guidance: "Use with confidence but note caveats for high-impact decisions.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Mixed reporting history; some validation, some refuted.",
    guidance: "Require corroboration before major judgments.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Frequent inaccuracies or unverifiable sourcing.",
    guidance: "Flag for validation; do not rely on alone.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "History of misleading or incorrect reporting.",
    guidance: "Treat as noise unless independently confirmed.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "New or unknown source; insufficient data to rate.",
    guidance: "Document provenance and seek cross-validation immediately.",
  },
};

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityEntry {
  const entry = SOURCE_RELIABILITY_SCALE[code];
  if (!entry) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }
  return entry;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
  narrative: string;
}

const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    description: "Judgments rest on high-quality information and/or logic.",
    narrative: "Evidence lines up cleanly with strong analytic agreement.",
  },
  moderate: {
    level: "moderate",
    description: "Information is credible but significant gaps or caveats remain.",
    narrative:
      "Evidence is mixed or requires assumptions; confidence could shift quickly.",
  },
  low: {
    level: "low",
    description: "Information is scant, questionable, or contradictory.",
    narrative: "Judgment is speculative and should be treated as early warning only.",
  },
};

export function getConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  const descriptor = CONFIDENCE_LEVELS[level];
  if (!descriptor) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
  return descriptor;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: "low" | "moderate" | "high" | "critical";
}

export type RiskMatrix = RiskScore[][];

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 5;

function assertDimension(
  value: number,
  field: "likelihood" | "impact",
): asserts value is LikelihoodLevel {
  if (!Number.isInteger(value) || value < MIN_DIMENSION || value > MAX_DIMENSION) {
    throw new Error(
      `${field} must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}. Received: ${value}`,
    );
  }
}

type RiskBand = RiskScore["band"];

function resolveRiskBand(score: number): RiskBand {
  if (score <= 4) return "low";
  if (score <= 9) return "moderate";
  if (score <= 16) return "high";
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertDimension(likelihood, "likelihood");
  assertDimension(impact, "impact");
  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    band: resolveRiskBand(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let l = MIN_DIMENSION; l <= MAX_DIMENSION; l += 1) {
    const row: RiskScore[] = [];
    for (let i = MIN_DIMENSION; i <= MAX_DIMENSION; i += 1) {
      row.push(
        calculateRiskScore(l as LikelihoodLevel, i as ImpactLevel),
      );
    }
    matrix.push(row);
  }
  return matrix;
}

export type ActionStatus = "pending" | "in_progress" | "complete";

const ACTION_STATUSES: ActionStatus[] = ["pending", "in_progress", "complete"];

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const action = input.action?.trim();
  const owner = input.owner?.trim();
  const deadline = input.deadline?.trim();
  if (!action) {
    throw new Error("Action description is required.");
  }
  if (!owner) {
    throw new Error("Action owner is required.");
  }
  if (!deadline) {
    throw new Error("Action deadline is required.");
  }
  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) {
    throw new Error("Deadline must be a valid ISO-8601 date string.");
  }
  const status = input.status ?? "pending";
  if (!ACTION_STATUSES.includes(status)) {
    throw new Error(`Unknown action status: ${status}`);
  }
  return {
    action,
    owner,
    deadline: parsedDeadline.toISOString(),
    status,
  };
}
