export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  label: SourceReliability;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  ordinal: number;
  description: string;
}

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type RiskBucket = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  riskScore: number;
  bucket: RiskBucket;
}

export type RiskMatrix = RiskMatrixCell[];

export interface ActionItem {
  owner: string;
  description: string;
  deadline: string;
  completed: boolean;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityDescriptor
> = {
  A: {
    label: "A",
    description: "Completely reliable; confirmed by multiple trusted sources.",
  },
  B: { label: "B", description: "Usually reliable; solid past performance." },
  C: {
    label: "C",
    description: "Fairly reliable; mixed record requiring corroboration.",
  },
  D: {
    label: "D",
    description: "Not usually reliable; significant past inconsistencies.",
  },
  E: {
    label: "E",
    description: "Unreliable; reporting frequently proven false.",
  },
  F: {
    label: "F",
    description: "Reliability cannot be judged; insufficient reporting history.",
  },
};

export const CONFIDENCE_SCALE: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    ordinal: 3,
    description: "Strong analytic agreement with high-quality, consistent sources.",
  },
  moderate: {
    level: "moderate",
    ordinal: 2,
    description: "Judgment based on credible but limited or mixed sources.",
  },
  low: {
    level: "low",
    ordinal: 1,
    description: "Sparse, questionable, or conflicting information.",
  },
};

function ensureScoreInRange(value: number, label: string): LikelihoodScore | ImpactScore {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5`);
  }
  return value as LikelihoodScore | ImpactScore;
}

function deriveBucket(score: number): RiskBucket {
  if (score >= 20) {
    return "critical";
  }
  if (score >= 12) {
    return "high";
  }
  if (score >= 6) {
    return "moderate";
  }
  if (score >= 3) {
    return "low";
  }
  return "minimal";
}

export function computeRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
): RiskMatrixCell {
  const normalizedLikelihood = ensureScoreInRange(likelihood, "likelihood");
  const normalizedImpact = ensureScoreInRange(impact, "impact");
  const riskScore = Number(normalizedLikelihood) * Number(normalizedImpact);

  return {
    likelihood: normalizedLikelihood as LikelihoodScore,
    impact: normalizedImpact as ImpactScore,
    riskScore,
    bucket: deriveBucket(riskScore),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const cells: RiskMatrixCell[] = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    for (let impact = 1; impact <= 5; impact += 1) {
      cells.push(
        computeRiskScore(likelihood as LikelihoodScore, impact as ImpactScore),
      );
    }
  }

  return cells.sort((a, b) => {
    if (a.riskScore === b.riskScore) {
      if (a.likelihood === b.likelihood) {
        return b.impact - a.impact;
      }
      return b.likelihood - a.likelihood;
    }
    return b.riskScore - a.riskScore;
  });
}

function normalizeIsoString(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("deadline must be a non-empty ISO string");
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("deadline must be a valid ISO 8601 string");
  }

  const normalized = date.toISOString();
  if (normalized !== trimmed) {
    // Enforce canonical ISO formatting to simplify downstream storage.
    return normalized;
  }
  return trimmed;
}

export function createActionItem(input: {
  owner: string;
  description: string;
  deadline: string;
  completed?: boolean;
}): ActionItem {
  const owner = input.owner.trim();
  const description = input.description.trim();

  if (!owner) {
    throw new Error("owner is required");
  }

  if (!description) {
    throw new Error("description is required");
  }

  const deadline = normalizeIsoString(input.deadline);

  return {
    owner,
    description,
    deadline,
    completed: Boolean(input.completed),
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  if (item.completed) {
    return false;
  }

  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("ActionItem deadline is not a valid ISO string");
  }

  return deadline.getTime() < referenceDate.getTime();
}
