# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliability;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskScore =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15
  | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
  category: RiskCategory;
}

export type RiskMatrixRow = RiskMatrixCell[];
export type RiskMatrix = RiskMatrixRow[];

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Constants & Functions

```
export const SOURCE_RELIABILITY_SCALE: ReadonlyArray<SourceReliabilityDefinition>;

export function describeSourceReliability(
  code: SourceReliability
): SourceReliabilityDefinition;

export const CONFIDENCE_LEVELS: ReadonlyArray<ConfidenceLevel>;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function riskCategoryFromScore(score: RiskScore): RiskCategory;

export function generateRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- Pure TypeScript module (no IO, network, or randomness).
- Validation errors should throw `Error` with human-readable messages.
- This contract is frozen for builders; do not modify without product sign-off.
