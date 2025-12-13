# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityInfo {
  level: SourceReliability;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type RiskScaleValue = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  value: number; // 1-25
  category: RiskCategory;
}

export interface RiskMatrixCell {
  likelihood: RiskScaleValue;
  impact: RiskScaleValue;
  score: RiskScore;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskMatrixCell>>;

export type ActionStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  owner: string;
  summary: string;
  deadline: string; // ISO 8601
  status: ActionStatus;
}
```

## Functions

```
export function isSourceReliability(value: unknown): value is SourceReliability;

export function describeSourceReliability(
  level: SourceReliability
): SourceReliabilityInfo;

export function isConfidenceLevel(value: unknown): value is ConfidenceLevel;

export function calculateRiskScore(
  likelihood: RiskScaleValue,
  impact: RiskScaleValue
): RiskScore;

export function generateRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  owner: string;
  summary: string;
  deadline: string | Date;
  status?: ActionStatus;
}): ActionItem;
```

## Notes

- All exports are pure utilities to keep intelligence product builders
  consistent with AF/ICD standards.
- No IO, network, or logging in this module.
- This contract is **frozen** for builders; do not change without product
  approval.
