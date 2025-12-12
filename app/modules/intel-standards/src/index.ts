export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliability;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_ENTRIES: SourceReliabilityEntry[] = [
  {
    code: "A",
    label: "Completely reliable",
    description: "No doubt about authenticity, history of complete reliability.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubt; confirmed in most previous reporting.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Doubtful or unconfirmed history, but generally gives truthful information.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt; history of inaccuracy or bias.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Confirmed inaccuracies or severe bias; information requires independent corroboration.",
  },
  {
    code: "F",
    label: "Cannot be judged",
    description: "Insufficient information to evaluate the source or its reporting history.",
  },
];

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityEntry
> = SOURCE_RELIABILITY_ENTRIES.reduce((acc, entry) => {
  acc[entry.code] = entry;
  return acc;
}, {} as Record<SourceReliability, SourceReliabilityEntry>);

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

const CONFIDENCE_ENTRIES: ConfidenceDescriptor[] = [
  {
    level: "high",
    label: "High confidence",
    description:
      "Judgments are well corroborated with consistent sourcing across time.",
  },
  {
    level: "moderate",
    label: "Moderate confidence",
    description:
      "Information is plausible but may rely on limited sources or analytic assumptions.",
  },
  {
    level: "low",
    label: "Low confidence",
    description:
      "Information is fragmentary, uncorroborated, or comes from questionable sources.",
  },
];

export const CONFIDENCE_DESCRIPTORS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
> = CONFIDENCE_ENTRIES.reduce((acc, entry) => {
  acc[entry.level] = entry;
  return acc;
}, {} as Record<ConfidenceLevel, ConfidenceDescriptor>);

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  rating: RiskRating;
}

export type RiskMatrix = RiskScore[][]; // 5 rows x 5 columns

const LIKELIHOOD_LEVELS: ReadonlyArray<LikelihoodLevel> = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: ReadonlyArray<ImpactLevel> = [1, 2, 3, 4, 5];

function ensureLevel(value: number, field: string): LikelihoodLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${field} must be an integer between 1 and 5.`);
  }
  return value as LikelihoodLevel;
}

function determineRating(score: number): RiskRating {
  if (score >= 17) {
    return "critical";
  }
  if (score >= 10) {
    return "high";
  }
  if (score >= 5) {
    return "moderate";
  }
  return "low";
}

export function deriveRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  const normalizedLikelihood = ensureLevel(likelihood, "likelihood");
  const normalizedImpact = ensureLevel(impact, "impact");
  const value = normalizedLikelihood * normalizedImpact;

  return {
    likelihood: normalizedLikelihood,
    impact: normalizedImpact,
    value,
    rating: determineRating(value),
  };
}

export function createRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => deriveRiskScore(likelihood, impact)),
  );
}

export interface ActionItem {
  task: string;
  owner: string;
  deadline: string; // ISO 8601
  status: "pending" | "in_progress" | "completed";
  notes?: string;
}

export interface ActionItemInput {
  task: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItem["status"];
  notes?: string;
}

const ACTION_STATUSES: ActionItem["status"][] = [
  "pending",
  "in_progress",
  "completed",
];

function requireNonEmpty(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeStatus(status?: ActionItem["status"]): ActionItem["status"] {
  if (!status) {
    return "pending";
  }
  if (!ACTION_STATUSES.includes(status)) {
    throw new RangeError(
      `status must be one of: ${ACTION_STATUSES.join(", ")}.`,
    );
  }
  return status;
}

function normalizeDeadline(deadline: string | Date): string {
  const parsed =
    deadline instanceof Date ? new Date(deadline.getTime()) : new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date or ISO string.");
  }
  return parsed.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const task = requireNonEmpty(input.task, "task");
  const owner = requireNonEmpty(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const status = normalizeStatus(input.status);
  const notes = input.notes?.trim();

  return {
    task,
    owner,
    deadline,
    status,
    ...(notes ? { notes } : {}),
  };
}

function resolveReferenceDate(referenceDate?: Date | string): Date {
  if (!referenceDate) {
    return new Date();
  }
  if (referenceDate instanceof Date) {
    return referenceDate;
  }
  const parsed = new Date(referenceDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("referenceDate must be a valid date.");
  }
  return parsed;
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean {
  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Action item deadline is not a valid date.");
  }
  const comparePoint = resolveReferenceDate(referenceDate);
  return deadline.getTime() < comparePoint.getTime();
}
