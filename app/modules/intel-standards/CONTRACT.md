# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<
  SourceReliability,
  string
>;

export type ConfidenceLevel = "high" | "moderate" | "low";

export const CONFIDENCE_LEVEL_DESCRIPTIONS: Record<
  ConfidenceLevel,
  string
>;

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact
  rating: RiskRating;
}

export type RiskMatrix = RiskScore[][];

export type ActionStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
  status: ActionStatus;
}
```

## Functions

```
export function describeSourceReliability(
  level: SourceReliability
): string;

export function describeConfidence(level: ConfidenceLevel): string;

export function evaluateRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function generateRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string
): boolean;
```

## Notes

- All utilities are pure and deterministic given their inputs.
- Validation errors should throw `Error` with descriptive messages (e.g., invalid
  deadline format or out-of-range likelihood/impact).
- This contract is **frozen** for builders; do not modify without product input.
