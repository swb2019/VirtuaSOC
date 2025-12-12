export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  title: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
> = {
  A: {
    title: "Completely reliable",
    description:
      "Confirmed by independent sources; history of accurate, timely reporting.",
  },
  B: {
    title: "Usually reliable",
    description: "Minor gaps exist but the source is generally trustworthy.",
  },
  C: {
    title: "Fairly reliable",
    description: "Mixed record or limited history; corroboration recommended.",
  },
  D: {
    title: "Not usually reliable",
    description:
      "Known issues with accuracy or objectivity; requires strong confirmation.",
  },
  E: {
    title: "Unreliable",
    description:
      "Frequent inaccuracies or strong bias; use only with exceptional caution.",
  },
  F: {
    title: "Reliability cannot be judged",
    description:
      "Insufficient information to assess track record or sourcing quality.",
  },
};

export function describeSourceReliability(
  grade: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[grade];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_ORDER: Readonly<ConfidenceLevel[]> = [
  "low",
  "moderate",
  "high",
];

function confidenceRank(level: ConfidenceLevel): number {
  return CONFIDENCE_ORDER.indexOf(level);
}

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel,
): number {
  return confidenceRank(a) - confidenceRank(b);
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskCategory = "low" | "moderate" | "high";

const LEVELS: readonly LikelihoodLevel[] = [1, 2, 3, 4, 5];

export type RiskMatrix = Readonly<
  Record<LikelihoodLevel, Readonly<Record<ImpactLevel, number>>>
>;

function buildRiskMatrix(): RiskMatrix {
  const matrix = {} as Record<LikelihoodLevel, Record<ImpactLevel, number>>;
  LEVELS.forEach((likelihood) => {
    const row = {} as Record<ImpactLevel, number>;
    LEVELS.forEach((impact) => {
      row[impact] = likelihood * impact;
    });
    matrix[likelihood] = row;
  });
  return matrix;
}

export const RISK_MATRIX: RiskMatrix = buildRiskMatrix();

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // 1-25
  category: RiskCategory;
}

export function getRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  return RISK_MATRIX[likelihood][impact];
}

function deriveRiskCategory(score: number): RiskCategory {
  if (score <= 6) {
    return "low";
  }
  if (score <= 15) {
    return "moderate";
  }
  return "high";
}

export function assessRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const score = getRiskScore(likelihood, impact);
  return {
    likelihood,
    impact,
    score,
    category: deriveRiskCategory(score),
  };
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: Date | string,
): boolean {
  const reference = toDate(referenceDate) ?? new Date();
  const deadline = toDate(action.deadline);

  if (!deadline || !reference) {
    return false;
  }

  return deadline.getTime() < reference.getTime();
}
