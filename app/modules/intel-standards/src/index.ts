export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityGrade,
  SourceReliabilityDescriptor
> = {
  A: {
    grade: "A",
    label: "Completely reliable",
    description: "No doubt about source authenticity, veracity, or competency.",
  },
  B: {
    grade: "B",
    label: "Usually reliable",
    description: "Minor doubt about authenticity, veracity, or competency.",
  },
  C: {
    grade: "C",
    label: "Fairly reliable",
    description: "Doubtful credibility or veracity; history mixed.",
  },
  D: {
    grade: "D",
    label: "Not usually reliable",
    description: "Significant doubt; requires corroboration before use.",
  },
  E: {
    grade: "E",
    label: "Unreliable",
    description: "Untrustworthy source with known issues.",
  },
  F: {
    grade: "F",
    label: "Cannot be judged",
    description:
      "Insufficient information to evaluate source reliability.",
  },
};

export function getSourceReliabilityDescriptor(
  grade: SourceReliabilityGrade,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[grade];
}

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
      "Judgment is based on high-quality information and/or the nature of the issue makes it highly likely.",
  },
  moderate: {
    level: "moderate",
    description:
      "Information is credibly sourced and plausible but not of sufficient quality to warrant high confidence.",
  },
  low: {
    level: "low",
    description:
      "Information is scant, questionable, or fragmented; judgment is speculative.",
  },
};

export type LikelihoodRating = 1 | 2 | 3 | 4 | 5;
export type ImpactRating = 1 | 2 | 3 | 4 | 5;
export type RiskCategory = "low" | "moderate" | "high";

export interface RiskMatrixCell {
  likelihood: LikelihoodRating;
  impact: ImpactRating;
}

export interface RiskScore {
  likelihood: LikelihoodRating;
  impact: ImpactRating;
  value: number;
  category: RiskCategory;
}

export type RiskMatrix = readonly RiskCategory[][];

const LOW_RISK_MAX = 8;
const MODERATE_RISK_MAX = 15;

function riskCategoryFrom(value: number): RiskCategory {
  if (value <= LOW_RISK_MAX) {
    return "low";
  }
  if (value <= MODERATE_RISK_MAX) {
    return "moderate";
  }
  return "high";
}

function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskCategory[][] = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskCategory[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push(riskCategoryFrom(likelihood * impact));
    }
    matrix.push(row);
  }
  return matrix;
}

export const RISK_MATRIX: RiskMatrix = buildRiskMatrix();

export function deriveRiskScore(cell: RiskMatrixCell): RiskScore {
  const value = cell.likelihood * cell.impact;
  return {
    likelihood: cell.likelihood,
    impact: cell.impact,
    value,
    category: riskCategoryFrom(value),
  };
}

export type ActionItemStatus = "planned" | "in_progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
  status: ActionItemStatus;
}

export interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}

const ISO_INSTANT_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function isIsoDateString(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!ISO_INSTANT_REGEX.test(trimmed)) {
    return false;
  }
  const date = new Date(trimmed);
  return !Number.isNaN(date.getTime());
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const description = input.description?.trim();
  if (!description) {
    throw new Error("Action item description is required.");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("Action item owner is required.");
  }

  const deadline = input.deadline?.trim();
  if (!deadline || !isIsoDateString(deadline)) {
    throw new Error("Action item deadline must be an ISO 8601 string.");
  }

  return {
    description,
    owner,
    deadline: new Date(deadline).toISOString(),
    status: input.status ?? "planned",
  };
}
