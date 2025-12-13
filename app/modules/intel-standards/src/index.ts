export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_DESCRIPTORS: SourceReliabilityDescriptor[] = [
  {
    code: "A",
    label: "Completely reliable",
    description:
      "No doubt of authenticity, trustworthiness, or competency; history of complete reliability.",
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Minor doubt of authenticity, trustworthiness, or competency.",
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Doubt of authenticity, trustworthiness, or competency.",
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Significant doubt of authenticity, trustworthiness, or competency.",
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Lack of authenticity, trustworthiness, or competency; history of unreliability.",
  },
  {
    code: "F",
    label: "Reliability cannot be judged",
    description: "Insufficient information to evaluate reliability.",
  },
];

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
> = Object.freeze(
  SOURCE_RELIABILITY_DESCRIPTORS.reduce(
    (acc, descriptor) => {
      acc[descriptor.code] = descriptor;
      return acc;
    },
    {} as Record<SourceReliability, SourceReliabilityDescriptor>,
  ),
);

export function describeSourceReliability(
  code: SourceReliability,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_SCALE[code];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

const CONFIDENCE_DESCRIPTORS: ConfidenceDescriptor[] = [
  {
    level: "high",
    description:
      "Judgment is based on high-quality information, consistent reporting, and strong reasoning.",
  },
  {
    level: "moderate",
    description:
      "Judgment is based on credibly sourced information but may have gaps, assumptions, or mixed reporting.",
  },
  {
    level: "low",
    description:
      "Judgment is based on limited, questionable, or contradictory information; significant gaps exist.",
  },
];

export const CONFIDENCE_SCALE: Readonly<
  Record<ConfidenceLevel, ConfidenceDescriptor>
> = Object.freeze(
  CONFIDENCE_DESCRIPTORS.reduce(
    (acc, descriptor) => {
      acc[descriptor.level] = descriptor;
      return acc;
    },
    {} as Record<ConfidenceLevel, ConfidenceDescriptor>,
  ),
);

export function describeConfidence(level: ConfidenceLevel): ConfidenceDescriptor {
  return CONFIDENCE_SCALE[level];
}

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

export type RiskClassification = "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: Likelihood;
  impact: Impact;
  score: RiskScore;
  classification: RiskClassification;
}

export type RiskMatrix = RiskMatrixCell[][];

const LIKELIHOOD_VALUES: Likelihood[] = [1, 2, 3, 4, 5];
const IMPACT_VALUES: Impact[] = [1, 2, 3, 4, 5];

export function calculateRiskScore(
  likelihood: Likelihood,
  impact: Impact,
): RiskScore {
  return (likelihood * impact) as RiskScore;
}

export function classifyRisk(score: RiskScore): RiskClassification {
  if (score >= 20) {
    return "critical";
  }
  if (score >= 13) {
    return "high";
  }
  if (score >= 6) {
    return "moderate";
  }
  return "low";
}

export function buildRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_VALUES.map((likelihood) =>
    IMPACT_VALUES.map((impact) => {
      const score = calculateRiskScore(likelihood, impact);
      return {
        likelihood,
        impact,
        score,
        classification: classifyRisk(score),
      } as RiskMatrixCell;
    }),
  );
}

export type ActionItemStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (isNaN(deadline.getTime())) {
      throw new Error("Invalid deadline date");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("Deadline is required");
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid deadline date");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem {
  const action = input.action.trim();
  const owner = input.owner.trim();

  if (!action) {
    throw new Error("Action is required");
  }
  if (!owner) {
    throw new Error("Owner is required");
  }

  const deadline = normalizeDeadline(input.deadline);
  return {
    action,
    owner,
    deadline,
    status: input.status ?? "pending",
  };
}
