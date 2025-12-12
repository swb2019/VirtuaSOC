export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable source with a proven history.",
  B: "Usually reliable; minor doubts based on recent variance.",
  C: "Fairly reliable but inconsistencies exist.",
  D: "Not usually reliable; requires corroboration.",
  E: "Unreliable source; significant credibility issues.",
  F: "Cannot be judged; reliability unknown.",
};

export function describeSourceReliability(code: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  high: "Judgments rest on high-quality information and reasoning.",
  moderate: "Judgments are plausible but information has gaps or conflicts.",
  low: "Judgments are speculative with limited or questionable sourcing.",
};

export function describeConfidence(level: ConfidenceLevel): string {
  return CONFIDENCE_DESCRIPTIONS[level];
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

const LIKELIHOOD_SCALE: Likelihood[] = [1, 2, 3, 4, 5];
const IMPACT_SCALE: Impact[] = [1, 2, 3, 4, 5];

type RiskCategory = "low" | "moderate" | "elevated" | "high" | "critical";

export interface RiskScore {
  likelihood: Likelihood;
  impact: Impact;
  value: number;
  category: RiskCategory;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

function deriveRiskCategory(value: number): RiskCategory {
  if (value <= 5) {
    return "low";
  }
  if (value <= 10) {
    return "moderate";
  }
  if (value <= 15) {
    return "elevated";
  }
  if (value <= 20) {
    return "high";
  }
  return "critical";
}

export function computeRiskScore(
  likelihood: Likelihood,
  impact: Impact,
): RiskScore {
  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    category: deriveRiskCategory(value),
  };
}

export function buildRiskMatrix(): RiskMatrix {
  const rows = LIKELIHOOD_SCALE.map((likelihood) =>
    Object.freeze(
      IMPACT_SCALE.map((impact) => computeRiskScore(likelihood, impact)),
    ),
  );
  return Object.freeze(rows) as RiskMatrix;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem {
  const description = input.description?.trim();
  if (!description) {
    throw new Error("Action description is required.");
  }

  const owner = input.owner?.trim();
  if (!owner) {
    throw new Error("Action owner is required.");
  }

  const deadlineRaw = input.deadline?.trim();
  if (!deadlineRaw) {
    throw new Error("Action deadline is required.");
  }

  const deadlineDate = new Date(deadlineRaw);
  if (Number.isNaN(deadlineDate.getTime())) {
    throw new Error("Action deadline must be a valid date.");
  }

  // Normalize to ISO 8601 to maintain consistency in downstream modules.
  const deadline = deadlineDate.toISOString();

  return {
    description,
    owner,
    deadline,
  };
}
