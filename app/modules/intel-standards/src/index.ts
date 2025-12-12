export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  name: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    name: "Completely reliable",
    description:
      "Sources with a history of complete reliability; corroborated and trusted",
  },
  B: {
    code: "B",
    name: "Usually reliable",
    description:
      "Minor gaps in past reporting but generally trustworthy and corroborated",
  },
  C: {
    code: "C",
    name: "Fairly reliable",
    description: "Mixed past performance; further corroboration recommended",
  },
  D: {
    code: "D",
    name: "Not usually reliable",
    description:
      "Significant inconsistencies or limited history; treat with skepticism",
  },
  E: {
    code: "E",
    name: "Unreliable",
    description:
      "Reporting frequently disproved or contradicted; use only with strong support",
  },
  F: {
    code: "F",
    name: "Reliability cannot be judged",
    description: "Completely new or untested sources without prior evaluation",
  },
};

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export function isValidSourceReliability(
  code: string,
): code is SourceReliabilityCode {
  return Object.prototype.hasOwnProperty.call(SOURCE_RELIABILITY_SCALE, code);
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    description:
      "Strong analytic agreement with ample evidence and minimal assumptions",
  },
  moderate: {
    level: "moderate",
    description:
      "Evidence is credible but includes gaps, conflicting inputs, or assumptions",
  },
  low: {
    level: "low",
    description:
      "Sparse or questionable evidence; significant uncertainty remains",
  },
};

export type LikelihoodRating = 1 | 2 | 3 | 4 | 5;
export type ImpactRating = 1 | 2 | 3 | 4 | 5;

const RATING_VALUES: ReadonlyArray<LikelihoodRating> = [1, 2, 3, 4, 5];

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodRating;
  impact: ImpactRating;
  score: number;
  category: RiskCategory;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

function assertRating(
  rating: number,
  label: "likelihood" | "impact",
): asserts rating is LikelihoodRating {
  if (!RATING_VALUES.includes(rating as LikelihoodRating)) {
    throw new RangeError(
      `${label} must be between 1 and 5. Received: ${rating}`,
    );
  }
}

function determineCategory(score: number): RiskCategory {
  if (score <= 6) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 19) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodRating,
  impact: ImpactRating,
): RiskScore {
  assertRating(likelihood, "likelihood");
  assertRating(impact, "impact");
  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    category: determineCategory(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return RATING_VALUES.map((likelihood) =>
    RATING_VALUES.map((impact) =>
      calculateRiskScore(likelihood, impact as ImpactRating),
    ),
  );
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be provided`);
  }
  return trimmed;
}

function normalizeIsoTimestamp(value: string): string {
  const trimmed = value.trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }
  const iso = date.toISOString();
  if (iso !== trimmed) {
    throw new Error("deadline must be provided in ISO 8601 UTC format");
  }
  return iso;
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = assertNonEmpty(input.description, "description");
  const owner = assertNonEmpty(input.owner, "owner");
  const deadline = normalizeIsoTimestamp(input.deadline);

  return Object.freeze({ description, owner, deadline });
}

function toDate(input?: Date | string): Date {
  if (!input) {
    return new Date();
  }
  if (input instanceof Date) {
    return input;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("referenceDate must be a valid date");
  }
  return date;
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean {
  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("ActionItem deadline is invalid");
  }
  return deadline.getTime() < toDate(referenceDate).getTime();
}
