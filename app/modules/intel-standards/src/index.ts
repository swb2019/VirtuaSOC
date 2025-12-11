export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  level: SourceReliability;
  description: string;
}

const SOURCE_RELIABILITY_DEFINITIONS: SourceReliabilityDefinition[] = [
  { level: "A", description: "Completely reliable" },
  { level: "B", description: "Usually reliable" },
  { level: "C", description: "Fairly reliable" },
  { level: "D", description: "Not usually reliable" },
  { level: "E", description: "Unreliable" },
  { level: "F", description: "Reliability cannot be judged" },
];

const SOURCE_RELIABILITY_MAP = new Map<SourceReliability, string>(
  SOURCE_RELIABILITY_DEFINITIONS.map((entry) => [entry.level, entry.description]),
);

export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDefinition[] =
  SOURCE_RELIABILITY_DEFINITIONS;

export function describeSourceReliability(level: SourceReliability): string {
  const description = SOURCE_RELIABILITY_MAP.get(level);
  if (!description) {
    throw new Error(`Unsupported source reliability level: ${level}`);
  }
  return description;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

const CONFIDENCE_THRESHOLDS = {
  high: 0.75,
  moderate: 0.4,
} as const;

export function confidenceFromProbability(probability: number): ConfidenceLevel {
  if (!Number.isFinite(probability)) {
    throw new Error("Probability must be a finite number");
  }
  if (probability < 0 || probability > 1) {
    throw new Error("Probability must be within [0,1]");
  }

  if (probability >= CONFIDENCE_THRESHOLDS.high) {
    return "high";
  }
  if (probability >= CONFIDENCE_THRESHOLDS.moderate) {
    return "moderate";
  }
  return "low";
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export const LIKELIHOOD_LEVELS: readonly LikelihoodLevel[] = [
  1,
  2,
  3,
  4,
  5,
];

export const IMPACT_LEVELS: readonly ImpactLevel[] = [1, 2, 3, 4, 5];

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  band: RiskBand;
}

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export interface RiskMatrix {
  cells: RiskMatrixCell[];
  getCell(
    likelihood: LikelihoodLevel,
    impact: ImpactLevel,
  ): RiskMatrixCell | undefined;
}

function determineRiskBand(value: number): RiskBand {
  if (value <= 4) {
    return "low";
  }
  if (value <= 9) {
    return "moderate";
  }
  if (value <= 16) {
    return "high";
  }
  return "critical";
}

export function computeRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    band: determineRiskBand(value),
  };
}

export function createRiskMatrix(): RiskMatrix {
  const cells: RiskMatrixCell[] = [];
  const index = new Map<string, RiskMatrixCell>();

  for (const likelihood of LIKELIHOOD_LEVELS) {
    for (const impact of IMPACT_LEVELS) {
      const score = computeRiskScore(likelihood, impact);
      const cell: RiskMatrixCell = { likelihood, impact, score };
      cells.push(cell);
      index.set(`${likelihood}-${impact}`, cell);
    }
  }

  return {
    cells,
    getCell(likelihood, impact) {
      return index.get(`${likelihood}-${impact}`);
    },
  };
}

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

function normalizeDeadline(deadline: string | Date): string {
  const date =
    typeof deadline === "string" ? new Date(deadline) : new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid deadline: unable to parse date");
  }
  return date.toISOString();
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem {
  if (!input.description || input.description.trim().length === 0) {
    throw new Error("description is required");
  }
  if (!input.owner || input.owner.trim().length === 0) {
    throw new Error("owner is required");
  }

  const deadline = normalizeDeadline(input.deadline);

  return {
    description: input.description.trim(),
    owner: input.owner.trim(),
    deadline,
    status: input.status ?? "pending",
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date | string = new Date(),
): boolean {
  const reference =
    typeof referenceDate === "string"
      ? new Date(referenceDate)
      : new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) {
    throw new Error("Invalid reference date");
  }

  return new Date(item.deadline).getTime() < reference.getTime();
}
