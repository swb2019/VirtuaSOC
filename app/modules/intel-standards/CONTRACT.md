# Contract: intel-standards

## Types

```
export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact
  severity: RiskSeverity;
}

export type RiskMatrix = RiskScore[][]; // 5 rows x 5 columns

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Functions

```
export function describeSourceReliability(
  grade: SourceReliabilityGrade
): SourceReliabilityDescriptor;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
}): ActionItem;
```

## Notes

- All utilities are synchronous, pure, and side-effect free.
- Functions validate their inputs and throw `Error` with helpful messages when invalid.
- This contract is frozen for Builders; do not modify without product approval.
