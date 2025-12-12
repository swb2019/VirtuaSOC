# Contract: intel-standards

## Types

```
export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  classification: "low" | "guarded" | "moderate" | "high" | "critical";
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601 date string
}
```

## Functions

```
export function describeSourceReliability(
  grade: SourceReliabilityGrade
): SourceReliabilityDescriptor;

export function describeConfidence(
  level: ConfidenceLevel
): ConfidenceDescriptor;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All functions are pure and deterministic.
- No logging, IO, or network requests inside this module.
- This contract is frozen for downstream builders.
