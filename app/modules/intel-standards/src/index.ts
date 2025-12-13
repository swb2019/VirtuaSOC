export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  title: string;
  description: string;
}

const SOURCE_RELIABILITY_MAP: Record<
  SourceReliability,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    title: "Completely reliable",
    description: "History of reliability; no doubt about authenticity or trust.",
  },
  B: {
    code: "B",
    title: "Usually reliable",
    description: "Minor doubts, but generally provides sound, corroborated reporting.",
  },
  C: {
    code: "C",
    title: "Fairly reliable",
    description:
      "Mixed record; requires independent corroboration before heavy reliance.",
  },
  D: {
    code: "D",
    title: "Not usually reliable",
    description: "Significant doubts about validity; use only with strong support.",
  },
  E: {
    code: "E",
    title: "Unreliable",
    description:
      "Previous reporting proven false or deceptive; use for context only.",
  },
  F: {
    code: "F",
    title: "Reliability cannot be judged",
    description: "No prior reporting or provenance is unknown/untested.",
  },
};

export const SOURCE_RELIABILITY_SCALE: SourceReliabilityDescriptor[] =
  Object.values(SOURCE_RELIABILITY_MAP);

export function describeSourceReliability(
  code: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_MAP[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "high" | "severe" | "critical";

const RISK_BAND_THRESHOLDS: { maxScore: number; band: RiskBand }[] = [
  { maxScore: 5, band: "low" },
  { maxScore: 10, band: "moderate" },
  { maxScore: 15, band: "high" },
  { maxScore: 20, band: "severe" },
  { maxScore: Infinity, band: "critical" },
];

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  return likelihood * impact;
}

export function riskBandForScore(score: number): RiskBand {
  const entry = RISK_BAND_THRESHOLDS.find(({ maxScore }) => score <= maxScore);
  // entry is always defined because final band uses Infinity.
  return entry!.band;
}

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export type RiskMatrix = RiskCell[][];

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];

  for (let likelihood = 1 as LikelihoodLevel; likelihood <= 5; likelihood++) {
    const row: RiskCell[] = [];
    for (let impact = 1 as ImpactLevel; impact <= 5; impact++) {
      const score = calculateRiskScore(likelihood, impact);
      row.push({
        likelihood,
        impact,
        score,
        band: riskBandForScore(score),
      });
    }
    matrix.push(row);
  }

  return matrix;
}

export type ActionStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  title: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

export function createActionItem(input: {
  title: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const title = ensureValue(input.title, "title");
  const owner = ensureValue(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  return {
    title,
    owner,
    deadline,
    status,
  };
}

function ensureValue(value: string, field: keyof ActionItem): string {
  if (value == null) {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${field} must not be empty`);
  }
  return trimmed;
}

function normalizeDeadline(raw: string): string {
  if (raw == null) {
    throw new Error("deadline is required");
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("deadline must not be empty");
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid date");
  }
  return date.toISOString();
}
