export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityEntry
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description: "Proven record with fully corroborated reporting.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description: "Mostly accurate with minor gaps that require verification.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description: "Mixed record; needs corroboration for critical decisions.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Sporadic accuracy; generally treated with caution.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "History of inaccurate or biased reporting.",
  },
  F: {
    code: "F",
    label: "Reliability cannot be judged",
    description: "New, untested, or anonymous source.",
  },
};

export function describeSourceReliability(
  code: SourceReliabilityCode
): SourceReliabilityEntry {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceEntry {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceEntry> = {
  high: {
    level: "high",
    description:
      "Judgment rests on high-quality information and/or is strongly supported.",
  },
  moderate: {
    level: "moderate",
    description:
      "Information is credible and plausible but not of sufficient quality for high confidence.",
  },
  low: {
    level: "low",
    description:
      "Information is fragmentary, poorly corroborated, or questionable.",
  },
};

export function describeConfidenceLevel(
  level: ConfidenceLevel
): ConfidenceEntry {
  return CONFIDENCE_LEVELS[level];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "substantial" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  band: RiskBand;
}

export type RiskMatrix = RiskScore[][];

const FIVE_POINT_SCALE: ReadonlyArray<LikelihoodLevel> = [1, 2, 3, 4, 5];

const RISK_BAND_THRESHOLDS: { max: number; band: RiskBand }[] = [
  { max: 5, band: "low" },
  { max: 10, band: "moderate" },
  { max: 15, band: "substantial" },
  { max: 20, band: "high" },
  { max: Infinity, band: "critical" },
];

function assertFivePointValue(
  label: string,
  value: number
): asserts value is LikelihoodLevel {
  if (!FIVE_POINT_SCALE.includes(value as LikelihoodLevel)) {
    throw new Error(`${label} must be between 1 and 5`);
  }
}

function deriveRiskBand(value: number): RiskBand {
  const found = RISK_BAND_THRESHOLDS.find((threshold) => value <= threshold.max);
  if (!found) {
    return "critical";
  }
  return found.band;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore {
  assertFivePointValue("likelihood", likelihood);
  assertFivePointValue("impact", impact);

  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    band: deriveRiskBand(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];

  for (const likelihood of FIVE_POINT_SCALE) {
    const row: RiskScore[] = [];
    for (const impact of FIVE_POINT_SCALE) {
      row.push(calculateRiskScore(likelihood, impact as ImpactLevel));
    }
    matrix.push(row);
  }

  return matrix;
}

export const RISK_MATRIX: RiskMatrix = buildRiskMatrix();

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601 timestamp
  status: "pending" | "in-progress" | "done";
}

function normalizeIsoTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date or ISO string");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
  status?: ActionItem["status"];
}): ActionItem {
  const summary = input.summary.trim();
  const owner = input.owner.trim();

  if (!summary) {
    throw new Error("summary is required");
  }

  if (!owner) {
    throw new Error("owner is required");
  }

  return {
    summary,
    owner,
    deadline: normalizeIsoTimestamp(input.deadline),
    status: input.status ?? "pending",
  };
}
