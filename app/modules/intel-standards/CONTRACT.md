# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, string>
>;

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVELS: Readonly<ConfidenceLevel[]>;

export const LIKELIHOOD_LEVELS: Readonly<[1, 2, 3, 4, 5]>;
export const IMPACT_LEVELS: Readonly<[1, 2, 3, 4, 5]>;

export type LikelihoodLevel = (typeof LIKELIHOOD_LEVELS)[number];
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // 1-25
  category: RiskCategory;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export type ActionItemStatus = "pending" | "in-progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date
  status: ActionItemStatus;
}
```

## Functions

```
export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem;

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: string | Date
): boolean;
```

## Notes

- All exports are pure utilities; no side effects or IO.
- ISO 8601 deadline strings are enforced to keep audit logs consistent.
- Risk categories follow ISO-31000 style guardrails (1-5 scale producing 1-25 scores).
- This contract is frozen for the builder phase.
