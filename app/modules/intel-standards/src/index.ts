export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_DEFINITIONS: SourceReliabilityDefinition[] = [
  {
    code: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, trustworthiness, or competency; history of complete reliability.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubt about authenticity, trustworthiness, or competency; history of mostly valid reporting.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Doubt about authenticity, trustworthiness, or competency but has provided valid information in the past.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt; provided valid information only occasionally.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Majority of reporting questionable or invalid; strong doubt exists.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient information to evaluate reliability.",
  },
];

export function listSourceReliability(): SourceReliabilityDefinition[] {
  return SOURCE_RELIABILITY_DEFINITIONS.slice();
}

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDefinition {
  const definition = SOURCE_RELIABILITY_DEFINITIONS.find((entry) => entry.code === code);
  if (!definition) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }
  return definition;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDefinition {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

const CONFIDENCE_DEFINITIONS: ConfidenceDefinition[] = [
  {
    level: "high",
    label: "High confidence",
    description: "Judgment based on high-quality information or source; chance of being wrong is low.",
  },
  {
    level: "moderate",
    label: "Moderate confidence",
    description: "Information is credibly sourced and plausible but not of sufficient quality to warrant high confidence.",
  },
  {
    level: "low",
    label: "Low confidence",
    description: "Judgment based on questionable or implausible information and/or limited source reliability.",
  },
];

export function listConfidenceLevels(): ConfidenceDefinition[] {
  return CONFIDENCE_DEFINITIONS.slice();
}

export function getConfidence(level: ConfidenceLevel): ConfidenceDefinition {
  const definition = CONFIDENCE_DEFINITIONS.find((entry) => entry.level === level);
  if (!definition) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
  return definition;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory =
  | "informational"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  category: RiskCategory;
}

export type RiskMatrix = RiskCell[][];

function assertRange(value: number, label: string): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer from 1 to 5. Received: ${value}`);
  }
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  assertRange(likelihood, "Likelihood");
  assertRange(impact, "Impact");
  return likelihood * impact;
}

export function categorizeRisk(score: number): RiskCategory {
  if (score <= 5) return "informational";
  if (score <= 10) return "low";
  if (score <= 15) return "moderate";
  if (score <= 20) return "high";
  return "critical";
}

export function evaluateRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskCell {
  const score = calculateRiskScore(likelihood, impact);
  return Object.freeze({
    likelihood,
    impact,
    score,
    category: categorizeRisk(score),
  });
}

export function createRiskMatrix(): RiskMatrix {
  const matrix: RiskMatrix = [];
  for (let likelihood = 1 as LikelihoodLevel; likelihood <= 5; likelihood++) {
    const row: RiskCell[] = [];
    for (let impact = 1 as ImpactLevel; impact <= 5; impact++) {
      row.push(evaluateRisk(likelihood, impact));
    }
    matrix.push(row);
  }
  return matrix;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string;
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
}

function assertIsoTimestamp(value: string): string {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error(`Deadline must be an ISO 8601 timestamp. Received: ${value}`);
  }
  return new Date(ms).toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = assertNonEmpty(input.description, "Description");
  const owner = assertNonEmpty(input.owner, "Owner");
  const deadline = assertIsoTimestamp(assertNonEmpty(input.deadline, "Deadline"));

  const action: ActionItem = {
    description,
    owner,
    deadline,
  };

  return Object.freeze(action);
}
