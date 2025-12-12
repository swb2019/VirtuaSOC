export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityMetadata {
  code: SourceReliability;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityMetadata
> = {
  A: {
    code: "A",
    label: "Completely reliable",
    description:
      "Proven trustworthy sources with a history of accurate reporting.",
  },
  B: {
    code: "B",
    label: "Usually reliable",
    description:
      "Generally dependable sources with rare inaccuracies or gaps.",
  },
  C: {
    code: "C",
    label: "Fairly reliable",
    description:
      "Mixed reporting track record; corroboration recommended.",
  },
  D: {
    code: "D",
    label: "Not usually reliable",
    description:
      "Often inconsistent or biased; significant verification required.",
  },
  E: {
    code: "E",
    label: "Unreliable",
    description:
      "Historically inaccurate or deceptive; treat reporting with caution.",
  },
  F: {
    code: "F",
    label: "Cannot judge",
    description:
      "Insufficient information exists to evaluate source reliability.",
  },
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceMetadata {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<
  ConfidenceLevel,
  ConfidenceMetadata
> = {
  high: {
    level: "high",
    description:
      "Well-corroborated analytic judgement with consistent evidentiary support.",
  },
  moderate: {
    level: "moderate",
    description:
      "Reasoned assessment with incomplete or partially conflicting evidence.",
  },
  low: {
    level: "low",
    description:
      "Speculative outcome with scarce, questionable, or contradictory evidence.",
  },
};

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskTier = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  value: number;
  tier: RiskTier;
}

export interface RiskCell extends RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
}

const RISK_TIER_THRESHOLDS: { max: number; tier: RiskTier }[] = [
  { max: 4, tier: "minimal" },
  { max: 9, tier: "low" },
  { max: 14, tier: "moderate" },
  { max: 19, tier: "high" },
  { max: 25, tier: "critical" },
];

function tierForScore(score: number): RiskTier {
  const found = RISK_TIER_THRESHOLDS.find(({ max }) => score <= max);
  if (!found) {
    throw new Error(`Risk score ${score} outside expected range 1-25`);
  }
  return found.tier;
}

function assertLevel(value: number, dimension: string): asserts value is LikelihoodLevel {
  const isInteger = Number.isInteger(value);
  if (!isInteger || value < 1 || value > 5) {
    throw new Error(
      `Invalid ${dimension} level "${value}". Expected integer between 1 and 5.`,
    );
  }
}

export class RiskMatrix {
  static readonly MIN_LEVEL: LikelihoodLevel = 1;
  static readonly MAX_LEVEL: LikelihoodLevel = 5;

  static computeScore(
    likelihood: LikelihoodLevel,
    impact: ImpactLevel,
  ): RiskScore {
    assertLevel(likelihood, "likelihood");
    assertLevel(impact, "impact");
    const value = likelihood * impact;
    return {
      value,
      tier: tierForScore(value),
    };
  }

  static getCell(
    likelihood: LikelihoodLevel,
    impact: ImpactLevel,
  ): RiskCell {
    const score = this.computeScore(likelihood, impact);
    return {
      likelihood,
      impact,
      ...score,
    };
  }

  static build(): RiskCell[][] {
    const matrix: RiskCell[][] = [];
    for (
      let likelihood = this.MIN_LEVEL;
      likelihood <= this.MAX_LEVEL;
      likelihood++
    ) {
      const row: RiskCell[] = [];
      for (
        let impact = this.MIN_LEVEL;
        impact <= this.MAX_LEVEL;
        impact++
      ) {
        row.push(
          this.getCell(
            likelihood as LikelihoodLevel,
            impact as ImpactLevel,
          ),
        );
      }
      matrix.push(row);
    }
    return matrix;
  }
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string;
}

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_ZULU =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isIso8601Date(value: string): boolean {
  return ISO_DATE_ONLY.test(value) || ISO_DATE_TIME_ZULU.test(value);
}

export function createActionItem(input: ActionItem): ActionItem {
  const summary = input.summary?.trim();
  const owner = input.owner?.trim();
  const deadline = input.deadline?.trim();

  if (!summary) {
    throw new Error("Action item summary is required");
  }
  if (!owner) {
    throw new Error("Action item owner is required");
  }
  if (!deadline) {
    throw new Error("Action item deadline is required");
  }
  if (!isIso8601Date(deadline)) {
    throw new Error(
      "Action item deadline must be ISO 8601 date (YYYY-MM-DD) or UTC datetime",
    );
  }

  return {
    summary,
    owner,
    deadline,
  };
}
