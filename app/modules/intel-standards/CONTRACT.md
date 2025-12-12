# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  name: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodRating = 1 | 2 | 3 | 4 | 5;
export type ImpactRating = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodRating;
  impact: ImpactRating;
  score: number; // likelihood * impact
  category: RiskCategory;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Record<SourceReliabilityCode, SourceReliabilityDescriptor>;
export const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceDescriptor>;
```

## Functions

```
export function getSourceReliability(
  code: SourceReliabilityCode
): SourceReliabilityDescriptor;

export function isValidSourceReliability(
  code: string
): code is SourceReliabilityCode;

export function calculateRiskScore(
  likelihood: LikelihoodRating,
  impact: ImpactRating
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string
): boolean;
```

## Notes

- All functions are pure and deterministic.
- No IO, randomness, or environment access is permitted in this module.
- Builders must keep this contract stable unless the backlog explicitly calls
  for changes.
