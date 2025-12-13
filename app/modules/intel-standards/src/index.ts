export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliability,
  string
> = {
  A: "Completely reliable: history of complete reliability with confirmed data.",
  B: "Usually reliable: minor doubts due to limited contradictions.",
  C: "Fairly reliable: credentials present but some conflicting reporting.",
  D: "Not usually reliable: significant doubt, corroboration required.",
  E: "Unreliable: unproven source that frequently conflicts with known data.",
  F: "Reliability cannot be judged: source is new or information is untested.",
};

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_ORDER: ConfidenceLevel[] = [
  "low",
  "moderate",
  "high",
];

export function describeSourceReliability(code: SourceReliability): string {
  return SOURCE_RELIABILITY_DESCRIPTIONS[code];
}

export function confidenceRank(level: ConfidenceLevel): number {
  return CONFIDENCE_ORDER.indexOf(level);
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  band: RiskBand;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

function assertLevelInRange(
  label: "likelihood" | "impact",
  value: number,
): asserts value is LikelihoodLevel & ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer between 1 and 5`);
  }
}

function classifyRisk(value: number): RiskBand {
  if (value <= 5) {
    return "low";
  }
  if (value <= 10) {
    return "moderate";
  }
  if (value <= 15) {
    return "high";
  }
  return "critical";
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertLevelInRange("likelihood", likelihood);
  assertLevelInRange("impact", impact);

  const value = likelihood * impact;
  return {
    likelihood,
    impact,
    value,
    band: classifyRisk(value),
  };
}

export function createRiskMatrix(): RiskMatrix {
  const rows: RiskScore[][] = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    const row: RiskScore[] = [];
    for (let impact = 1; impact <= 5; impact += 1) {
      row.push(
        calculateRiskScore(
          likelihood as LikelihoodLevel,
          impact as ImpactLevel,
        ),
      );
    }
    rows.push(row);
  }
  return rows;
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
}

function toIsoDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    if (isNaN(deadline.getTime())) {
      throw new Error("deadline Date is invalid");
    }
    return deadline.toISOString();
  }

  const trimmed = deadline.trim();
  if (!trimmed) {
    throw new Error("deadline must be provided");
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date or ISO string");
  }
  return parsed.toISOString();
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
}): ActionItem {
  const action = input.action.trim();
  const owner = input.owner.trim();

  if (!action) {
    throw new Error("action must be provided");
  }
  if (!owner) {
    throw new Error("owner must be provided");
  }

  return {
    action,
    owner,
    deadline: toIsoDeadline(input.deadline),
  };
}
