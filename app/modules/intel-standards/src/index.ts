export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  rating: RiskRating;
}

export type RiskMatrix = RiskScore[][];

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
}

export interface ActionItemInput {
  action: string;
  owner: string;
  deadline: string | Date;
}

const SOURCE_RELIABILITY_SCALE = [
  {
    code: "A",
    label: "Completely reliable",
    description: "No doubt of authenticity, history of accurate reporting.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubts; generally consistent, well-corroborated.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Some doubt; mixed history, needs independent confirmation.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt or limited track record.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Known issues with accuracy; use only with strong corroboration.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient information to assess reliability.",
  },
] as const satisfies readonly SourceReliabilityDescriptor[];

export { SOURCE_RELIABILITY_SCALE };

const SOURCE_RELIABILITY_BY_CODE: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = SOURCE_RELIABILITY_SCALE.reduce(
  (acc, descriptor) => {
    acc[descriptor.code] = descriptor;
    return acc;
  },
  {} as Record<SourceReliabilityCode, SourceReliabilityDescriptor>,
);

const CONFIDENCE_SCALE = [
  {
    level: "high",
    description:
      "Strongly supported by facts, methods, and sources with minimal assumptions.",
  },
  {
    level: "moderate",
    description:
      "Credible analysis, though important information gaps or assumptions remain.",
  },
  {
    level: "low",
    description:
      "Significant uncertainties or conflicting information; judgments prone to change.",
  },
] as const satisfies readonly ConfidenceDescriptor[];

export { CONFIDENCE_SCALE };

const CONFIDENCE_BY_LEVEL: Record<ConfidenceLevel, ConfidenceDescriptor> =
  CONFIDENCE_SCALE.reduce(
    (acc, descriptor) => {
      acc[descriptor.level] = descriptor;
      return acc;
    },
    {} as Record<ConfidenceLevel, ConfidenceDescriptor>,
  );

export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_BY_CODE[code];
}

export function describeConfidence(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return CONFIDENCE_BY_LEVEL[level];
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  return likelihood * impact;
}

export function deriveRiskRating(score: number): RiskRating {
  if (score >= 20) {
    return "critical";
  }
  if (score >= 12) {
    return "high";
  }
  if (score >= 6) {
    return "moderate";
  }
  return "low";
}

export function createRiskMatrix(): RiskMatrix {
  const rows: RiskMatrix = [];

  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      const typedLikelihood = likelihood as LikelihoodLevel;
      const typedImpact = impact as ImpactLevel;
      const score = calculateRiskScore(typedLikelihood, typedImpact);
      row.push({
        likelihood: typedLikelihood,
        impact: typedImpact,
        score,
        rating: deriveRiskRating(score),
      });
    }
    rows.push(row);
  }

  return rows;
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const action = normalizeNonEmpty(input.action, "action");
  const owner = normalizeNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);

  return {
    action,
    owner,
    deadline,
  };
}

function normalizeNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function normalizeDeadline(deadline: string | Date): string {
  const isoCandidate =
    typeof deadline === "string" ? deadline.trim() : deadline.toISOString();

  const date = new Date(isoCandidate);
  if (isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 date");
  }

  return date.toISOString();
}
