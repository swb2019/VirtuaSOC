export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDetail {
  level: SourceReliability;
  description: string;
}

const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string> = {
  A: "Completely reliable — proven trustworthy with vetted track record.",
  B: "Usually reliable — minor gaps but generally trustworthy.",
  C: "Fairly reliable — mixed record; corroboration required.",
  D: "Not usually reliable — significant prior issues.",
  E: "Unreliable — credibility in doubt; heavy validation required.",
  F: "Cannot be judged — no prior history or contradictory info.",
};

export function describeSourceReliability(
  level: SourceReliability,
): SourceReliabilityDetail {
  return { level, description: SOURCE_RELIABILITY_DESCRIPTIONS[level] };
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export type RiskMatrix = RiskScore[][]; // [likelihood][impact]

const LIKELIHOOD_LEVELS: ReadonlyArray<LikelihoodLevel> = [1, 2, 3, 4, 5];
const IMPACT_LEVELS: ReadonlyArray<ImpactLevel> = [1, 2, 3, 4, 5];

function assertRange<T extends number>(
  level: number,
  allowed: ReadonlyArray<T>,
  label: string,
): asserts level is T {
  if (!allowed.includes(level as T)) {
    throw new RangeError(`${label} must be between 1 and 5. Received: ${level}`);
  }
}

function deriveRiskBand(score: number): RiskBand {
  if (score <= 4) return "minimal";
  if (score <= 9) return "low";
  if (score <= 16) return "moderate";
  if (score <= 20) return "high";
  return "critical";
}

/**
 * Deterministically calculate a risk score and qualitative band from likelihood/impact.
 */
export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore {
  assertRange(likelihood, LIKELIHOOD_LEVELS, "likelihood");
  assertRange(impact, IMPACT_LEVELS, "impact");

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    band: deriveRiskBand(score),
  };
}

/**
 * Build the canonical 5x5 risk matrix (likelihood rows × impact columns).
 */
export function generateRiskMatrix(): RiskMatrix {
  return LIKELIHOOD_LEVELS.map((likelihood) =>
    IMPACT_LEVELS.map((impact) => calculateRiskScore(likelihood, impact)),
  );
}

export type ActionItemStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  id: string;
  action: string;
  owner: string;
  deadline: string;
  status: ActionItemStatus;
  notes?: string;
}

const DEFAULT_STATUS: ActionItemStatus = "pending";

function defaultIdFactory(): string {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDeadline(deadline: string | Date): string {
  const parsed = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("deadline must be a valid date or ISO string");
  }
  return parsed.toISOString();
}

function normalizeText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} cannot be empty`);
  }
  return normalized;
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
  notes?: string;
  idFactory?: () => string;
}): ActionItem {
  const action = normalizeText(input.action, "action");
  const owner = normalizeText(input.owner, "owner");
  const deadline = normalizeDeadline(input.deadline);
  const id = input.idFactory ? input.idFactory() : defaultIdFactory();
  const status = input.status ?? DEFAULT_STATUS;

  return {
    id,
    action,
    owner,
    deadline,
    status,
    ...(input.notes ? { notes: input.notes.trim() } : {}),
  };
}

export function updateActionItemStatus(
  item: ActionItem,
  status: ActionItemStatus,
): ActionItem {
  return { ...item, status };
}
