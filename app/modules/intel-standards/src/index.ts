export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export type RiskMatrixRow = RiskScore[];
export type RiskMatrix = RiskMatrixRow[];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
}

const SOURCE_RELIABILITY_SCALE: SourceReliabilityEntry[] = [
  {
    code: "A",
    label: "Completely reliable",
    description: "History of complete reliability; trusted without reservation.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts only; consistent track record with isolated issues.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Reasonable reliability but occasional inconsistencies present.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubts; requires corroboration before acting.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Poor reliability; use only with strong independent confirmation.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient history to evaluate reliability.",
  },
];

const SOURCE_RELIABILITY_LOOKUP = SOURCE_RELIABILITY_SCALE.reduce(
  (lookup, entry) => lookup.set(entry.code, entry),
  new Map<SourceReliabilityCode, SourceReliabilityEntry>(),
);

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "moderate", "low"];

const LEVEL_MIN = 1;
const LEVEL_MAX = 5;
const ISO_DEADLINE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function getSourceReliability(code: string): SourceReliabilityEntry {
  if (!code || code.trim().length === 0) {
    throw new TypeError("Source reliability code is required");
  }

  const normalized = code.trim().toUpperCase() as SourceReliabilityCode;
  const entry = SOURCE_RELIABILITY_LOOKUP.get(normalized);

  if (!entry) {
    throw new TypeError(`Unknown source reliability code: ${code}`);
  }

  return entry;
}

export function assertConfidenceLevel(value: string): asserts value is ConfidenceLevel {
  if (typeof value !== "string") {
    throw new TypeError("Confidence level must be a string");
  }

  if (!CONFIDENCE_LEVELS.includes(value as ConfidenceLevel)) {
    throw new TypeError(
      `Confidence level must be one of ${CONFIDENCE_LEVELS.join(", ")}`,
    );
  }
}

function assertLevel(
  label: string,
  value: number,
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer value`);
  }

  if (value < LEVEL_MIN || value > LEVEL_MAX) {
    throw new RangeError(`${label} must be between ${LEVEL_MIN} and ${LEVEL_MAX}`);
  }
}

function classifyRisk(score: number): RiskBand {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 17) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: number,
  impact: number,
): RiskScore {
  assertLevel("Likelihood", likelihood);
  assertLevel("Impact", impact);

  const typedLikelihood = likelihood as LikelihoodLevel;
  const typedImpact = impact as ImpactLevel;
  const score = typedLikelihood * typedImpact;

  return {
    likelihood: typedLikelihood,
    impact: typedImpact,
    score,
    band: classifyRisk(score),
  };
}

export function generateRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];

  for (let likelihood = LEVEL_MIN; likelihood <= LEVEL_MAX; likelihood += 1) {
    const row: RiskMatrixRow = [];
    for (let impact = LEVEL_MIN; impact <= LEVEL_MAX; impact += 1) {
      row.push(calculateRiskScore(likelihood, impact));
    }
    rows.push(row);
  }

  return rows;
}

function normalizeText(label: string, value: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new TypeError(`${label} cannot be empty`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = normalizeText("Deadline", deadline);

  if (!ISO_DEADLINE_REGEX.test(trimmed)) {
    throw new TypeError("Deadline must be an ISO 8601 UTC timestamp ending with Z");
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("Deadline must be a valid ISO 8601 timestamp");
  }

  return date.toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  if (!input) {
    throw new TypeError("Action item input is required");
  }

  const description = normalizeText("Description", input.description);
  const owner = normalizeText("Owner", input.owner);
  const deadline = normalizeDeadline(input.deadline);

  return {
    description,
    owner,
    deadline,
  };
}
