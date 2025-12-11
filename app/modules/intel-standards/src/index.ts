const SOURCE_RELIABILITY_VALUES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
] as const;

type SourceReliabilityInternal = (typeof SOURCE_RELIABILITY_VALUES)[number];

const CONFIDENCE_LEVEL_VALUES = ["high", "moderate", "low"] as const;
type ConfidenceLevelInternal = (typeof CONFIDENCE_LEVEL_VALUES)[number];

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;
type ScaleValue = (typeof SCALE_VALUES)[number];

const ACTION_STATUS_VALUES = ["pending", "in_progress", "done"] as const;
type ActionStatusInternal = (typeof ACTION_STATUS_VALUES)[number];

export type SourceReliability = SourceReliabilityInternal;
export type ConfidenceLevel = ConfidenceLevelInternal;
export type LikelihoodLevel = ScaleValue;
export type ImpactLevel = ScaleValue;
export type RiskScore =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = RiskMatrixCell[][];

export type ActionStatus = ActionStatusInternal;

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

function normalizeAlpha(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeConfidence(value: string): string {
  return value.trim().toLowerCase();
}

function assertScaleValue(value: number, label: string): asserts value is ScaleValue {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`Invalid ${label}: expected integer 1-5, received ${value}`);
  }
}

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
  return trimmed;
}

function ensureIsoDate(value: string): string {
  const trimmed = assertNonEmpty(value, "deadline");
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid deadline: ${value}`);
  }
  return new Date(timestamp).toISOString();
}

export function ensureSourceReliability(value: string): SourceReliability {
  const normalized = normalizeAlpha(value);
  if ((SOURCE_RELIABILITY_VALUES as readonly string[]).includes(normalized)) {
    return normalized as SourceReliability;
  }
  throw new Error(
    `Invalid source reliability "${value}". Expected one of ${SOURCE_RELIABILITY_VALUES.join(
      ", ",
    )}`,
  );
}

export function ensureConfidenceLevel(value: string): ConfidenceLevel {
  const normalized = normalizeConfidence(value);
  if ((CONFIDENCE_LEVEL_VALUES as readonly string[]).includes(normalized)) {
    return normalized as ConfidenceLevel;
  }
  throw new Error(
    `Invalid confidence level "${value}". Expected one of ${CONFIDENCE_LEVEL_VALUES.join(
      ", ",
    )}`,
  );
}

export function ensureLikelihood(value: number): LikelihoodLevel {
  assertScaleValue(value, "likelihood");
  return value as LikelihoodLevel;
}

export function ensureImpact(value: number): ImpactLevel {
  assertScaleValue(value, "impact");
  return value as ImpactLevel;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const score = likelihood * impact;
  return score as RiskScore;
}

export function createRiskMatrixCell(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskMatrixCell {
  return {
    likelihood,
    impact,
    score: calculateRiskScore(likelihood, impact),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];
  SCALE_VALUES.forEach((likelihood) => {
    const row: RiskMatrixCell[] = [];
    SCALE_VALUES.forEach((impact) => {
      row.push(createRiskMatrixCell(likelihood, impact));
    });
    rows.push(row);
  });
  return rows;
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const description = assertNonEmpty(input.description, "description");
  const owner = assertNonEmpty(input.owner, "owner");
  const status = input.status ?? "pending";
  if (!(ACTION_STATUS_VALUES as readonly string[]).includes(status)) {
    throw new Error(`Invalid status "${status}"`);
  }
  return {
    description,
    owner,
    deadline: ensureIsoDate(input.deadline),
    status,
  };
}
