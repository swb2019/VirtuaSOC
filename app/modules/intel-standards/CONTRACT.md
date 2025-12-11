# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  value: number;
  band: RiskBand;
}

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = RiskMatrixCell[][];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date or datetime
  completed: boolean;
}
```

## Constants & Functions

```
export const SOURCE_RELIABILITY_LEVELS: readonly SourceReliability[];
export function describeSourceReliability(level: SourceReliability): string;

export const CONFIDENCE_ORDER: readonly ConfidenceLevel[];
export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel
): number;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  completed?: boolean;
}): ActionItem;

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: Date
): boolean;
```

## Notes

- All helpers are pure and deterministic; they do not mutate inputs.
- Validation errors should be thrown using `Error` with descriptive messages.
- This contract is frozen for builders.
