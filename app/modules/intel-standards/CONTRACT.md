# Contract: intel-standards

## Types

```ts
export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  grade: SourceReliabilityGrade;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceLevelEntry {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // 1-25
  severity: RiskSeverity;
}

export type RiskMatrix = RiskCell[][]; // likelihood-major, 5 rows x 5 cols

export type ActionStatus = "pending" | "in-progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date string
  status: ActionStatus;
}
```

## Constants

```ts
export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityEntry[];
export const CONFIDENCE_LEVELS: readonly ConfidenceLevelEntry[];
```

## Functions

```ts
export function getSourceReliability(
  grade: SourceReliabilityGrade,
): SourceReliabilityEntry;

export function getConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceLevelEntry;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskCell;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string; // accepts ISO string or Date-compatible input
  status?: ActionStatus;
}): ActionItem;
```

## Notes

- All helpers are pure and deterministic.
- Validation errors must throw standard `Error` instances with descriptive messages.
- The contract is frozen for builders; do not modify without spec alignment.
```