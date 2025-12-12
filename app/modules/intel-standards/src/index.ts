export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  title: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    title: "Completely reliable",
    description: "No doubt about authenticity, history of complete reliability.",
  },
  B: {
    code: "B",
    title: "Usually reliable",
    description: "Minor doubt, but source has a reliable past performance.",
  },
  C: {
    code: "C",
    title: "Fairly reliable",
    description: "Doubt of authenticity or history of reasonable accuracy only.",
  },
  D: {
    code: "D",
    title: "Not usually reliable",
    description: "Significant doubt; past reporting has been sporadically valid.",
  },
  E: {
    code: "E",
    title: "Unreliable",
    description: "Considerable doubt; past reporting has proven false or lacking.",
  },
  F: {
    code: "F",
    title: "Cannot be judged",
    description: "Insufficient basis to evaluate reliability at this time.",
  },
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_LEVELS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = {
  high: {
    level: "high",
    description:
      "Well-corroborated assessment with strong analytic agreement and evidence.",
  },
  moderate: {
    level: "moderate",
    description:
      "Some corroboration exists but significant information gaps remain.",
  },
  low: {
    level: "low",
    description:
      "Sparse or conflicting reporting; analytic confidence is limited.",
  },
};

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;
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

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: Likelihood;
  impact: Impact;
  score: RiskScore;
  rating: RiskRating;
}

export interface RiskMatrix {
  cells: RiskCell[];
}

const RANGE_VALUES: Likelihood[] = [1, 2, 3, 4, 5];

function isMatrixValue(value: number): value is Likelihood {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isRiskScore(value: number): value is RiskScore {
  return Number.isInteger(value) && value >= 1 && value <= 25;
}

export function classifyRisk(score: RiskScore): RiskRating {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 20) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihoodInput: Likelihood,
  impactInput: Impact,
): RiskScore {
  const likelihood = Number(likelihoodInput);
  const impact = Number(impactInput);

  if (!isMatrixValue(likelihood)) {
    throw new Error("likelihood must be an integer between 1 and 5");
  }
  if (!isMatrixValue(impact)) {
    throw new Error("impact must be an integer between 1 and 5");
  }

  const score = likelihood * impact;
  if (!isRiskScore(score)) {
    throw new Error("risk score must be between 1 and 25");
  }

  return score as RiskScore;
}

export function createRiskMatrix(): RiskMatrix {
  const cells: RiskCell[] = [];

  for (const likelihood of RANGE_VALUES) {
    for (const impact of RANGE_VALUES) {
      const score = calculateRiskScore(likelihood, impact);
      cells.push({
        likelihood,
        impact,
        score,
        rating: classifyRisk(score),
      });
    }
  }

  return { cells };
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) {
      throw new Error("deadline Date must be valid");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("deadline is required");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date string");
  }

  return parsed.toISOString();
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string | Date;
}): ActionItem {
  const summary = input.summary.trim();
  const owner = input.owner.trim();

  if (!summary) {
    throw new Error("summary is required");
  }
  if (!owner) {
    throw new Error("owner is required");
  }

  return {
    summary,
    owner,
    deadline: normalizeDeadline(input.deadline),
  };
}
