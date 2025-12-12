export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
  guidance: string;
  weight: number;
}

const SOURCE_RELIABILITY_SCALE: SourceReliabilityDescriptor[] = [
  {
    code: "A",
    label: "Completely reliable",
    description: "Confirmed history of accurate reporting; formal channels.",
    guidance: "Use independently without corroboration when timeliness demands it.",
    weight: 1,
  },
  {
    code: "B",
    label: "Usually reliable",
    description: "Generally sound track record with minor gaps in coverage.",
    guidance: "Corroborate when feasible; otherwise acceptable for operational awareness.",
    weight: 2,
  },
  {
    code: "C",
    label: "Fairly reliable",
    description: "Mixed reporting quality or limited past performance.",
    guidance: "Require corroboration before elevating to executive reporting.",
    weight: 3,
  },
  {
    code: "D",
    label: "Not usually reliable",
    description: "Frequently inaccurate or unverifiable sources.",
    guidance: "Treat as tips only; seek validation from higher tiers.",
    weight: 4,
  },
  {
    code: "E",
    label: "Unreliable",
    description: "Historic bias, deception risk, or clear agenda.",
    guidance: "Only use when independently confirmed and marked appropriately.",
    weight: 5,
  },
  {
    code: "F",
    label: "Cannot be judged",
    description: "New or unknown source with no performance history.",
    guidance: "Flag for validation before inclusion in analytic products.",
    weight: 6,
  },
];

const SOURCE_RELIABILITY_LOOKUP: Record<SourceReliabilityCode, SourceReliabilityDescriptor> =
  SOURCE_RELIABILITY_SCALE.reduce((acc, descriptor) => {
    acc[descriptor.code] = descriptor;
    return acc;
  }, {} as Record<SourceReliabilityCode, SourceReliabilityDescriptor>);

export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor {
  return SOURCE_RELIABILITY_LOOKUP[code];
}

export function listSourceReliabilityScale(): SourceReliabilityDescriptor[] {
  return [...SOURCE_RELIABILITY_SCALE];
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

const CONFIDENCE_LEVELS: ConfidenceDescriptor[] = [
  {
    level: "high",
    label: "High confidence",
    description:
      "Evidence from multiple independent, reliable sources with consistent analysis.",
  },
  {
    level: "moderate",
    label: "Moderate confidence",
    description:
      "Credible information but gaps or disagreements remain; further collection advised.",
  },
  {
    level: "low",
    label: "Low confidence",
    description:
      "Fragmentary information, single-source reporting, or unresolved analytic disputes.",
  },
];

const CONFIDENCE_LOOKUP: Record<ConfidenceLevel, ConfidenceDescriptor> =
  CONFIDENCE_LEVELS.reduce((acc, descriptor) => {
    acc[descriptor.level] = descriptor;
    return acc;
  }, {} as Record<ConfidenceLevel, ConfidenceDescriptor>);

export function describeConfidence(level: ConfidenceLevel): ConfidenceDescriptor {
  return CONFIDENCE_LOOKUP[level];
}

export function listConfidenceLevels(): ConfidenceDescriptor[] {
  return [...CONFIDENCE_LEVELS];
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskAxisLevel<T extends number> {
  value: T;
  label: string;
  description: string;
}

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

const LIKELIHOOD_SCALE: RiskAxisLevel<LikelihoodLevel>[] = [
  { value: 1, label: "Rare", description: "Highly unlikely; no observed precedent." },
  { value: 2, label: "Unlikely", description: "Possible but not expected." },
  { value: 3, label: "Possible", description: "Could occur, limited precedent." },
  { value: 4, label: "Likely", description: "Occurs regularly; strong indicators." },
  { value: 5, label: "Almost certain", description: "Imminent or already occurring." },
];

const IMPACT_SCALE: RiskAxisLevel<ImpactLevel>[] = [
  { value: 1, label: "Negligible", description: "Little to no mission impact." },
  { value: 2, label: "Minor", description: "Contained impact; manual recovery." },
  { value: 3, label: "Moderate", description: "Service disruption or limited loss." },
  { value: 4, label: "Major", description: "Significant operational degradation." },
  { value: 5, label: "Critical", description: "Mission failure or severe harm." },
];

const LIKELIHOOD_VALUES: LikelihoodLevel[] = LIKELIHOOD_SCALE.map((entry) => entry.value);
const IMPACT_VALUES: ImpactLevel[] = IMPACT_SCALE.map((entry) => entry.value);

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number {
  return likelihood * impact;
}

export function classifyRisk(score: number): RiskBand {
  if (score >= 20) {
    return "critical";
  }
  if (score >= 12) {
    return "high";
  }
  if (score >= 6) {
    return "moderate";
  }
  return "low";
}

export function buildRiskMatrix(): RiskCell[][] {
  return LIKELIHOOD_VALUES.map((likelihood) =>
    IMPACT_VALUES.map((impact) => {
      const score = calculateRiskScore(likelihood, impact);
      return {
        likelihood,
        impact,
        score,
        band: classifyRisk(score),
      };
    }),
  );
}

export type ActionStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  owner: string;
  summary: string;
  deadline: string;
  status: ActionStatus;
}

export interface CreateActionItemInput {
  owner: string;
  summary: string;
  deadline: string | Date;
  status?: ActionStatus;
}

function ensureNonEmpty(value: string, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} must be provided.`);
  }
  return value.trim();
}

function normalizeDeadline(deadline: string | Date): string {
  if (deadline instanceof Date) {
    const ms = deadline.getTime();
    if (Number.isNaN(ms)) {
      throw new Error("Deadline must be a valid date.");
    }
    return deadline.toISOString();
  }

  const trimmed = ensureNonEmpty(deadline, "Deadline");
  const parsed = new Date(trimmed);
  const ms = parsed.getTime();
  if (Number.isNaN(ms)) {
    throw new Error("Deadline must be a valid date string.");
  }
  return parsed.toISOString();
}

export function createActionItem(input: CreateActionItemInput): ActionItem {
  const owner = ensureNonEmpty(input.owner, "Owner");
  const summary = ensureNonEmpty(input.summary, "Summary");
  const deadline = normalizeDeadline(input.deadline);

  return {
    owner,
    summary,
    deadline,
    status: input.status ?? "pending",
  };
}
