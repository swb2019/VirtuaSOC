export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_LEVELS: readonly SourceReliability[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable",
  B: "Usually reliable",
  C: "Fairly reliable",
  D: "Not usually reliable",
  E: "Unreliable",
  F: "Reliability cannot be judged",
};

export function describeSourceReliability(
  level: SourceReliability,
): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[level];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_ORDER: readonly ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
];

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel,
): number {
  const idxA = CONFIDENCE_ORDER.indexOf(a);
  const idxB = CONFIDENCE_ORDER.indexOf(b);
  if (idxA === idxB) {
    return 0;
  }
  return idxA < idxB ? 1 : -1;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  value: number;
  band: RiskBand;
}

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = RiskMatrixCell[][]; // 5 rows x 5 columns

const RISK_BAND_THRESHOLDS: Array<{ max: number; band: RiskBand }> = [
  { max: 5, band: "minimal" },
  { max: 10, band: "low" },
  { max: 15, band: "moderate" },
  { max: 20, band: "high" },
  { max: Number.POSITIVE_INFINITY, band: "critical" },
];

function assertRange(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5`);
  }
}

function deriveRiskBand(value: number): RiskBand {
  const bucket = RISK_BAND_THRESHOLDS.find((threshold) => value <= threshold.max);
  if (!bucket) {
    throw new Error("Unable to derive risk band");
  }
  return bucket.band;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertRange(likelihood, "likelihood");
  assertRange(impact, "impact");

  const value = likelihood * impact;
  return {
    value,
    band: deriveRiskBand(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];

  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskMatrixCell[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push({
        likelihood: likelihood as LikelihoodLevel,
        impact: impact as ImpactLevel,
        score: calculateRiskScore(
          likelihood as LikelihoodLevel,
          impact as ImpactLevel,
        ),
      });
    }
    rows.push(row);
  }

  return rows;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  completed: boolean;
}

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} cannot be empty`);
  }
  return trimmed;
}

function normalizeDeadline(input: string | Date): string {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error("deadline date is invalid");
    }
    return input.toISOString();
  }

  const trimmed = assertNonEmpty(input, "deadline");
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid ISO-8601 date string");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  completed?: boolean;
}): ActionItem {
  const owner = assertNonEmpty(input.owner, "owner");
  const description = assertNonEmpty(input.description, "description");
  const deadline = normalizeDeadline(input.deadline);

  return {
    description,
    owner,
    deadline,
    completed: input.completed ?? false,
  };
}

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  const reference = referenceDate.getTime();
  const deadline = new Date(action.deadline).getTime();
  if (isNaN(deadline)) {
    throw new Error("action deadline is not a valid date");
  }
  return deadline < reference && !action.completed;
}
