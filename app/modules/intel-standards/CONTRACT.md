# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  label: string;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
}

export type RiskMatrix = RiskCell[][];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 (date)
  status: "pending" | "in_progress" | "completed";
}
```

## Constants & Functions

```
export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityDescriptor
>;

export const CONFIDENCE_LEVELS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
>;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItem["status"];
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean;
```

## Notes

- All helpers are pure except `isActionItemOverdue`, which only reads the system clock when no reference date is provided.
- Consumers should treat the descriptor objects as read-only.
- This contract is frozen during the builder phase.
