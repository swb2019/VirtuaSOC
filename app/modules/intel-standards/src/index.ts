export type SourceReliabilityRating = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  rating: SourceReliabilityRating;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityRating,
  SourceReliabilityDescriptor
> = {
  A: {
    rating: "A",
    label: "Completely reliable",
    description:
      "Confirmed history of accuracy and verified access to the reported information.",
  },
  B: {
    rating: "B",
    label: "Usually reliable",
    description:
      "Generally trustworthy source with minor gaps or limited corroboration.",
  },
  C: {
    rating: "C",
    label: "Fairly reliable",
    description:
      "Mixed track record; information normally needs independent confirmation.",
  },
  D: {
    rating: "D",
    label: "Not usually reliable",
    description:
      "Inconsistent accuracy; significant doubt requires strong corroboration.",
  },
  E: {
    rating: "E",
    label: "Unreliable",
    description:
      "History of incorrect reporting or clear indications of compromised data.",
  },
  F: {
    rating: "F",
    label: "Reliability cannot be judged",
    description:
      "Insufficient insight into sourcing or access to determine reliability.",
  },
};

export function describeSourceReliability(
  rating: SourceReliabilityRating
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[rating];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    description:
      "Strong corroboration across sources with minimal analytic disagreement.",
  },
  moderate: {
    level: "moderate",
    description:
      "Some corroboration exists but notable information gaps remain.",
  },
  low: {
    level: "low",
    description:
      "Key assumptions are unproven or contradicting sources are unresolved.",
  },
};

export function describeConfidence(level: ConfidenceLevel): ConfidenceDescriptor {
  return CONFIDENCE_SCALE[level];
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export interface RiskMatrixCell {
  likelihood: Likelihood;
  impact: Impact;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

function assertRange(value: number, label: string): asserts value is Likelihood {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5.`);
  }
}

export function createRiskMatrixCell(input: {
  likelihood: number;
  impact: number;
}): RiskMatrixCell {
  assertRange(input.likelihood, "Likelihood");
  assertRange(input.impact, "Impact");

  const cell: RiskMatrixCell = {
    likelihood: input.likelihood as Likelihood,
    impact: input.impact as Impact,
  };

  return Object.freeze(cell) as RiskMatrixCell;
}

export function calculateRiskScore(cell: RiskMatrixCell): number {
  return cell.likelihood * cell.impact;
}

export function deriveRiskLevel(score: number): RiskLevel {
  if (!Number.isFinite(score) || score <= 0) {
    throw new Error("Risk score must be a positive number.");
  }

  if (score >= 20) {
    return "critical";
  }

  if (score >= 13) {
    return "high";
  }

  if (score >= 6) {
    return "moderate";
  }

  return "low";
}

export type ActionItemStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  title: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
}

function ensureNonEmpty(value: string, field: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${field} cannot be empty.`);
  }
  return value.trim();
}

function ensureIso8601(value: string): string {
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!iso8601Regex.test(value)) {
    throw new Error("Deadline must be an ISO 8601 UTC timestamp.");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Deadline must be a valid ISO 8601 date.");
  }
  return value;
}

export function createActionItem(input: {
  title: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem {
  const title = ensureNonEmpty(input.title, "Title");
  const owner = ensureNonEmpty(input.owner, "Owner");
  const deadline = ensureIso8601(input.deadline);
  const status = input.status ?? "pending";

  return {
    title,
    owner,
    deadline,
    status,
  };
}

export const IntelStandards = Object.freeze({
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
});
