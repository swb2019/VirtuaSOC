export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description:
      "Proven track record with verified reporting history; sourcing fully trusted.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description:
      "Generally credible with rare lapses; minor corroboration recommended.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description:
      "Mixed record; require corroboration before inclusion in critical products.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description: "Limited proof of accuracy; treat outputs as provisional only.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description: "Frequent inaccuracies or questionable tradecraft; high risk source.",
  },
  F: {
    code: "F",
    label: "Cannot be judged",
    description: "New or unknown source; no basis for reliability assessment yet.",
  },
};

export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  const descriptor = SOURCE_RELIABILITY_SCALE[code];
  if (!descriptor) {
    throw new Error(`Unknown source reliability code: ${code}`);
  }
  return descriptor;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  definition: string;
}

const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceDescriptor> = {
  high: {
    level: "high",
    definition:
      "Judgment is strongly supported by multiple independent, reliable sources.",
  },
  moderate: {
    level: "moderate",
    definition:
      "Judgment is plausible but requires additional corroboration or may change.",
  },
  low: {
    level: "low",
    definition:
      "Judgment is speculative with significant information gaps or disagreement.",
  },
};

export function describeConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceDescriptor {
  const descriptor = CONFIDENCE_LEVELS[level];
  if (!descriptor) {
    throw new Error(`Unknown confidence level: ${level}`);
  }
  return descriptor;
}

export type RiskValue = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

const RISK_VALUES: RiskValue[] = [1, 2, 3, 4, 5];

const RISK_BAND_THRESHOLDS: { max: number; band: RiskBand }[] = [
  { max: 5, band: "low" },
  { max: 10, band: "moderate" },
  { max: 15, band: "high" },
  { max: Number.POSITIVE_INFINITY, band: "critical" },
];

export interface RiskMatrixCell {
  likelihood: RiskValue;
  impact: RiskValue;
  score: number;
  band: RiskBand;
}

export type RiskMatrix = RiskMatrixCell[][];

export function calculateRiskScore(
  likelihood: RiskValue,
  impact: RiskValue,
): number {
  return likelihood * impact;
}

export function determineRiskBand(score: number): RiskBand {
  const threshold = RISK_BAND_THRESHOLDS.find((entry) => score <= entry.max);
  if (!threshold) {
    throw new Error(`Unable to classify risk score: ${score}`);
  }
  return threshold.band;
}

export function buildRiskMatrix(): RiskMatrix {
  return RISK_VALUES.map((likelihood) =>
    RISK_VALUES.map((impact) => {
      const score = calculateRiskScore(likelihood, impact);
      return {
        likelihood,
        impact,
        score,
        band: determineRiskBand(score),
      } satisfies RiskMatrixCell;
    }),
  );
}

export type ActionItemStatus = "planned" | "in_progress" | "done";

export interface ActionItem {
  owner: string;
  description: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}

interface ActionItemInput {
  owner: string;
  description: string;
  deadline: string;
  status?: ActionItemStatus;
}

function ensureNonEmpty(value: string, fieldName: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function normalizeIsoDeadline(deadline: string): string {
  const normalized = ensureNonEmpty(deadline, "deadline");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `deadline must be a valid ISO 8601 date string, received: ${deadline}`,
    );
  }
  return parsed.toISOString();
}

export function createActionItem(input: ActionItemInput): ActionItem {
  const owner = ensureNonEmpty(input.owner, "owner");
  const description = ensureNonEmpty(input.description, "description");
  const deadline = normalizeIsoDeadline(input.deadline);
  const status = input.status ?? "planned";

  return {
    owner,
    description,
    deadline,
    status,
  };
}

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date = new Date(),
): boolean {
  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error(
      `ActionItem deadline is not a valid ISO string: ${item.deadline}`,
    );
  }
  return deadline.getTime() < referenceDate.getTime();
}
