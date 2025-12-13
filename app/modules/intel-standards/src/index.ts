export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliability;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: ReadonlyArray<SourceReliabilityDefinition> =
  [
    { code: "A", description: "Completely reliable" },
    { code: "B", description: "Usually reliable" },
    { code: "C", description: "Fairly reliable" },
    { code: "D", description: "Not usually reliable" },
    { code: "E", description: "Unreliable" },
    { code: "F", description: "Reliability cannot be judged" },
  ];

export function describeSourceReliability(
  code: SourceReliability,
): SourceReliabilityDefinition {
  const definition = SOURCE_RELIABILITY_SCALE.find(
    (entry) => entry.code === code,
  );

  if (!definition) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }

  return definition;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: ReadonlyArray<ConfidenceLevel> = [
  "high",
  "moderate",
  "low",
];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

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

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
  category: RiskCategory;
}

export type RiskMatrixRow = ReadonlyArray<RiskMatrixCell>;
export type RiskMatrix = ReadonlyArray<RiskMatrixRow>;

const LEVELS: ReadonlyArray<LikelihoodLevel> = [1, 2, 3, 4, 5];

export const LIKELIHOOD_LEVELS: ReadonlyArray<LikelihoodLevel> = LEVELS;
export const IMPACT_LEVELS: ReadonlyArray<ImpactLevel> = LEVELS;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const score = likelihood * impact;
  return score as RiskScore;
}

export function riskCategoryFromScore(score: RiskScore): RiskCategory {
  if (score <= 4) {
    return "low";
  }
  if (score <= 9) {
    return "moderate";
  }
  if (score <= 16) {
    return "high";
  }
  return "critical";
}

export function generateRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => {
      const score = calculateRiskScore(likelihood, impact);
      return {
        likelihood,
        impact,
        score,
        category: riskCategoryFromScore(score),
      };
    }),
  );
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = normalizeRequiredString(input.description, "description");
  const owner = normalizeRequiredString(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);

  return { description, owner, deadline };
}

function normalizeRequiredString(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function normalizeDeadline(deadlineInput: string): string {
  const normalized = normalizeRequiredString(deadlineInput, "deadline");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }

  return date.toISOString();
}
