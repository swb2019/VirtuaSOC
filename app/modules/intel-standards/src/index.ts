export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  title: string;
  description: string;
}

const SOURCE_RELIABILITY_SCALE: SourceReliabilityEntry[] = [
  {
    code: "A",
    title: "Completely reliable",
    description:
      "History of complete reliability; vetted sources with multi-source corroboration.",
  },
  {
    code: "B",
    title: "Usually reliable",
    description:
      "Minor gaps in performance but generally dependable; corroboration recommended.",
  },
  {
    code: "C",
    title: "Fairly reliable",
    description:
      "Mixed performance; information requires independent verification before action.",
  },
  {
    code: "D",
    title: "Not usually reliable",
    description:
      "Frequent inaccuracies; information should be treated as tentative until confirmed.",
  },
  {
    code: "E",
    title: "Unreliable",
    description:
      "History of providing false or misleading information; use only with strong corroboration.",
  },
  {
    code: "F",
    title: "Cannot be judged",
    description:
      "Insufficient history or context to evaluate reliability; treat as unknown.",
  },
];

export function listSourceReliabilityScale(): SourceReliabilityEntry[] {
  return [...SOURCE_RELIABILITY_SCALE];
}

export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityEntry {
  const entry = SOURCE_RELIABILITY_SCALE.find((item) => item.code === code);
  if (!entry) {
    // Should never happen because `code` is a union, but guard anyway.
    throw new Error(`Unsupported source reliability code: ${code}`);
  }
  return entry;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_DESCRIPTORS: Record<ConfidenceLevel, string> = {
  high:
    "Judgment is well-supported by multiple independent sources with consistent reliability.",
  moderate:
    "Judgment is plausible but lacks complete corroboration or carries notable collection gaps.",
  low:
    "Judgment is speculative; information is scant, contradictory, or from low-confidence sources.",
};

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  return {
    level,
    description: CONFIDENCE_DESCRIPTORS[level],
  };
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = LikelihoodLevel;

export type RiskSeverity = "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  severity: RiskSeverity;
}

export type RiskMatrix = RiskCell[][];

const LEVELS: LikelihoodLevel[] = [1, 2, 3, 4, 5];

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  return likelihood * impact;
}

export function deriveRiskSeverity(score: number): RiskSeverity {
  if (score <= 5) {
    return "low";
  }
  if (score <= 12) {
    return "moderate";
  }
  if (score <= 19) {
    return "high";
  }
  return "critical";
}

export function createRiskCell(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskCell {
  const score = calculateRiskScore(likelihood, impact);
  return {
    likelihood,
    impact,
    score,
    severity: deriveRiskSeverity(score),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  return LEVELS.map((likelihood) =>
    LEVELS.map((impact) => createRiskCell(likelihood, impact)),
  );
}

export type ActionStatus = "pending" | "in-progress" | "done";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
  notes?: string;
}

function ensureNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be provided`);
  }
  return trimmed;
}

function assertIso8601(value: string): void {
  // Basic ISO-8601 date-time validation.
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!isoDatePattern.test(value)) {
    throw new Error("deadline must be an ISO-8601 UTC timestamp");
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error("deadline must be a valid date");
  }
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
  notes?: string;
}): ActionItem {
  const action = ensureNonEmpty(input.action, "action");
  const owner = ensureNonEmpty(input.owner, "owner");
  const deadline = ensureNonEmpty(input.deadline, "deadline");
  assertIso8601(deadline);

  return {
    action,
    owner,
    deadline,
    status: input.status ?? "pending",
    ...(input.notes ? { notes: input.notes.trim() } : {}),
  };
}
