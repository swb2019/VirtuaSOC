export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_MAP: Record<
  SourceReliability,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    label: "Completely Reliable",
    description:
      "Proven trustworthy; history of accurate reporting with independent confirmation.",
  },
  B: {
    code: "B",
    label: "Usually Reliable",
    description:
      "Generally trustworthy with minor gaps; previous data mostly confirmed.",
  },
  C: {
    code: "C",
    label: "Fairly Reliable",
    description:
      "Mixed track record; some reports confirmed, some disproven or unverified.",
  },
  D: {
    code: "D",
    label: "Not Usually Reliable",
    description:
      "Limited confirmation history; requires corroboration before action.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description:
      "Reports routinely disproven or contradicted; use only with strong validation.",
  },
  F: {
    code: "F",
    label: "Reliability Cannot Be Judged",
    description:
      "No prior reporting or insufficient information to assess reliability.",
  },
};

export const SOURCE_RELIABILITY_SCALE: ReadonlyArray<SourceReliabilityDescriptor> =
  Object.freeze(Object.values(SOURCE_RELIABILITY_MAP));

export function getSourceReliabilityDescriptor(
  code: SourceReliability
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_MAP[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: ReadonlyArray<ConfidenceLevel> = Object.freeze([
  "high",
  "moderate",
  "low",
]);

export function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return (
    typeof value === "string" &&
    (CONFIDENCE_LEVELS as ReadonlyArray<string>).includes(value)
  );
}

const FIVE_POINT_VALUES = [1, 2, 3, 4, 5] as const;
type FivePointValue = (typeof FIVE_POINT_VALUES)[number];

export type Likelihood = FivePointValue;
export type Impact = FivePointValue;

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: Likelihood;
  impact: Impact;
  value: number;
  level: RiskLevel;
}

export interface RiskMatrix
  extends Readonly<Record<Likelihood, Readonly<Record<Impact, RiskScore>>>> {}

function assertFivePoint(
  value: number,
  label: "likelihood" | "impact"
): asserts value is FivePointValue {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(
      `${label} must be an integer between 1 and 5. Received: ${value}`
    );
  }
}

function deriveRiskLevel(value: number): RiskLevel {
  if (value >= 16) return "critical";
  if (value >= 11) return "high";
  if (value >= 6) return "moderate";
  return "low";
}

export function calculateRiskScore(
  likelihood: Likelihood,
  impact: Impact
): RiskScore {
  assertFivePoint(likelihood, "likelihood");
  assertFivePoint(impact, "impact");

  const value = likelihood * impact;
  return Object.freeze({
    likelihood,
    impact,
    value,
    level: deriveRiskLevel(value),
  });
}

function buildRiskMatrix(): RiskMatrix {
  const matrix: Record<number, Readonly<Record<number, RiskScore>>> = {};

  FIVE_POINT_VALUES.forEach((likelihood) => {
    const row: Record<number, RiskScore> = {};
    FIVE_POINT_VALUES.forEach((impact) => {
      row[impact] = calculateRiskScore(likelihood, impact);
    });
    matrix[likelihood] = Object.freeze(row);
  });

  return Object.freeze(matrix) as RiskMatrix;
}

export const RISK_MATRIX: RiskMatrix = buildRiskMatrix();

export type ActionItemStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

function requireNonEmpty(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeIsoTimestamp(deadline: string): string {
  const trimmed = requireNonEmpty(deadline, "deadline");
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO-8601 timestamp.");
  }
  return date.toISOString();
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const summary = requireNonEmpty(input.summary, "summary");
  const owner = requireNonEmpty(input.owner, "owner");
  const deadline = normalizeIsoTimestamp(input.deadline);

  const status = input.status ?? "pending";
  if (!["pending", "in_progress", "done"].includes(status)) {
    throw new Error("status must be pending, in_progress, or done.");
  }

  return {
    summary,
    owner,
    deadline,
    status,
  };
}
