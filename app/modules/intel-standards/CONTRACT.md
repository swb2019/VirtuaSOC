# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // 1-25
  category: "low" | "moderate" | "high" | "critical";
}

export type RiskMatrix = RiskScore[][]; // rows=likelihood 1..5, cols=impact 1..5

export const ACTION_ITEM_STATUS: {
  readonly Pending: "pending";
  readonly InProgress: "in-progress";
  readonly Completed: "completed";
};

export type ActionItemStatus =
  (typeof ACTION_ITEM_STATUS)[keyof typeof ACTION_ITEM_STATUS];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string normalized by the factory
  status: ActionItemStatus;
}
```

## Functions

```
export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string>;
export function describeSourceReliability(scale: SourceReliability): string;

export function isConfidenceLevel(value: string): value is ConfidenceLevel;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string; // parsed + normalized to ISO 8601
  status?: ActionItemStatus;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate: Date
): boolean;
```

## Notes

- All helpers are pure/predictable.
- Validation errors should throw `Error` with clear messages.
- This contract is frozen for builders unless Product/Architecture updates it.
