export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[] = [
  {
    code: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, trust built over time.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts; source has proven trustworthy in most cases.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Some reservations; source reliability varies with context.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Frequent gaps or bias detected; corroboration required.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "History of inaccurate reporting; use only with strong backup.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient information to rate the source.",
  },
] as const;

const reliabilityByCode = new Map(
  SOURCE_RELIABILITY_SCALE.map((entry) => [entry.code, entry]),
);

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  const descriptor = reliabilityByCode.get(code);
  if (!descriptor) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }
  return descriptor;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_LEVELS: readonly ConfidenceDescriptor[] = [
  {
    level: "high",
    description:
      "High confidence: judgments grounded in high-quality, corroborated data.",
  },
  {
    level: "moderate",
    description:
      "Moderate confidence: information is credible but not corroborated.",
  },
  {
    level: "low",
    description: "Low confidence: information is questionable or fragmented.",
  },
] as const;

const confidenceByLevel = new Map(
  CONFIDENCE_LEVELS.map((entry) => [entry.level, entry]),
);

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  const descriptor = confidenceByLevel.get(level);
  if (!descriptor) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
  return descriptor;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskScore = number;

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskCell>>;

const LIKELIHOOD_LEVELS: readonly LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: readonly ImpactLevel[] = [1, 2, 3, 4, 5];

function assertWithinRange(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5.`);
  }
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertWithinRange(likelihood, "Likelihood");
  assertWithinRange(impact, "Impact");
  return likelihood * impact;
}

export function createRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => ({
      likelihood,
      impact,
      score: calculateRiskScore(likelihood, impact),
    })),
  );
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}

function ensureNonEmpty(input: string, field: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error(`${field} is required.`);
  }
  return value;
}

function normalizeDeadline(deadline: string): string {
  const trimmed = ensureNonEmpty(deadline, "Deadline");
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Deadline must be a valid date or ISO 8601 string.");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = ensureNonEmpty(input.description, "Description");
  const owner = ensureNonEmpty(input.owner, "Owner");
  const deadline = normalizeDeadline(input.deadline);

  return {
    description,
    owner,
    deadline,
  };
}
