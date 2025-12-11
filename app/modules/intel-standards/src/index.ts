export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityDefinition
> = {
  A: {
    code: "A",
    label: "Completely Reliable",
    description:
      "History of complete reliability; no doubt about authenticity or trustworthiness.",
  },
  B: {
    code: "B",
    label: "Usually Reliable",
    description:
      "Minor doubt based on limited issues, but generally dependable sources.",
  },
  C: {
    code: "C",
    label: "Fairly Reliable",
    description:
      "Some doubt; previous information occasionally requires corroboration.",
  },
  D: {
    code: "D",
    label: "Not Usually Reliable",
    description:
      "Significant doubt; past reporting has shown notable inaccuracies.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description:
      "History of misleading or fabricated information; requires heavy validation.",
  },
  F: {
    code: "F",
    label: "Reliability Unknown",
    description:
      "No basis for evaluating reliability (new or untested source).",
  },
};

export function getSourceReliabilityDefinition(
  code: SourceReliabilityCode,
): SourceReliabilityDefinition {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDefinition {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<
  ConfidenceLevel,
  ConfidenceDefinition
> = {
  high: {
    level: "high",
    description:
      "Strongly supported by multiple sources/data; minimal analytic doubt.",
  },
  moderate: {
    level: "moderate",
    description:
      "Plausible but limited evidence; some assumptions or gaps remain.",
  },
  low: {
    level: "low",
    description:
      "Speculative or weak evidence; significant doubt or conflicting reporting.",
  },
};

export function getConfidenceDefinition(
  level: ConfidenceLevel,
): ConfidenceDefinition {
  return CONFIDENCE_SCALE[level];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskClassification = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  classification: RiskClassification;
}

export type RiskMatrix = RiskScore[][];

function classifyRisk(value: number): RiskClassification {
  if (value <= 5) {
    return "low";
  }
  if (value <= 12) {
    return "moderate";
  }
  if (value <= 20) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    classification: classifyRisk(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihood = 1 as LikelihoodLevel; likelihood <= 5; likelihood++) {
    const row: RiskScore[] = [];
    for (let impact = 1 as ImpactLevel; impact <= 5; impact++) {
      row.push(calculateRiskScore(likelihood, impact));
    }
    matrix.push(row);
  }
  return matrix;
}

export type ActionStatus = "planned" | "in_progress" | "done";

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601 date string
  status: ActionStatus;
}

function toIsoDateString(input: string): string {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid deadline: ${input}`);
  }
  return date.toISOString();
}

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem {
  const summary = input.summary?.trim();
  const owner = input.owner?.trim();
  if (!summary) {
    throw new Error("Action summary is required");
  }
  if (!owner) {
    throw new Error("Action owner is required");
  }
  const deadline = toIsoDateString(input.deadline);
  return {
    summary,
    owner,
    deadline,
    status: input.status ?? "planned",
  };
}
