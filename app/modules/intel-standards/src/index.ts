export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliabilityCode, SourceReliabilityEntry>
> = Object.freeze({
  A: Object.freeze({
    code: "A",
    label: "Completely reliable",
    description:
      "History of complete reliability. Trusted to provide accurate information.",
  }),
  B: Object.freeze({
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts exist; repeated confirmation recommended.",
  }),
  C: Object.freeze({
    code: "C",
    label: "Fairly reliable",
    description:
      "Questionable history or limited track record; corroboration required.",
  }),
  D: Object.freeze({
    code: "D",
    label: "Not usually reliable",
    description:
      "Frequent inconsistencies or bias noted; treat with strong caution.",
  }),
  E: Object.freeze({
    code: "E",
    label: "Unreliable",
    description:
      "History of providing false or misleading information; only use with overwhelming corroboration.",
  }),
  F: Object.freeze({
    code: "F",
    label: "Cannot be judged",
    description:
      "Insufficient context to evaluate reliability of the source.",
  }),
} as const);

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = Object.freeze([
  "high",
  "moderate",
  "low",
] as const);

export type RiskAxisValue = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: RiskAxisValue;
  impact: RiskAxisValue;
  score: number;
  band: RiskBand;
}

const RISK_THRESHOLD_MAP: ReadonlyArray<{ max: number; band: RiskBand }> = [
  { max: 4, band: "low" },
  { max: 9, band: "moderate" },
  { max: 16, band: "high" },
  { max: 25, band: "critical" },
];

function ensureAxisValue(
  value: number,
  field: "likelihood" | "impact",
): RiskAxisValue {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${field} must be an integer between 1 and 5`);
  }
  if (value < 1 || value > 5) {
    throw new RangeError(`${field} must be between 1 and 5`);
  }
  return value as RiskAxisValue;
}

function deriveRiskBand(score: number): RiskBand {
  const match = RISK_THRESHOLD_MAP.find((entry) => score <= entry.max);
  // Should always find a match for a 5x5 matrix.
  return match?.band ?? "critical";
}

export function calculateRiskScore(
  likelihood: RiskAxisValue,
  impact: RiskAxisValue,
): RiskScore {
  const safeLikelihood = ensureAxisValue(likelihood, "likelihood");
  const safeImpact = ensureAxisValue(impact, "impact");
  const score = safeLikelihood * safeImpact;

  return Object.freeze({
    likelihood: safeLikelihood,
    impact: safeImpact,
    score,
    band: deriveRiskBand(score),
  });
}

const AXIS_VALUES: RiskAxisValue[] = [1, 2, 3, 4, 5];

export const RISK_MATRIX: readonly (readonly RiskScore[])[] = Object.freeze(
  AXIS_VALUES.map((likelihood) =>
    Object.freeze(
      AXIS_VALUES.map((impact) => calculateRiskScore(likelihood, impact)),
    ),
  ),
);

export type ActionItemStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  label: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

function normalizeText(field: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} cannot be empty`);
  }
  return trimmed;
}

function normalizeDeadline(deadline: string): string {
  const isoSource = normalizeText("deadline", deadline);
  const parsed = new Date(isoSource);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  label: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const label = normalizeText("label", input.label);
  const owner = normalizeText("owner", input.owner);
  const deadline = normalizeDeadline(input.deadline);
  const status = input.status ?? "pending";

  return Object.freeze({
    label,
    owner,
    deadline,
    status,
  });
}
