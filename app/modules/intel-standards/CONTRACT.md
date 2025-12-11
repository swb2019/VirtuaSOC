# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  label: SourceReliability;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  ordinal: number; // 3-high, 2-moderate, 1-low
  description: string;
}

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type RiskBucket = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  riskScore: number; // likelihood * impact
  bucket: RiskBucket;
}

export type RiskMatrix = RiskMatrixCell[];

export interface ActionItem {
  owner: string;
  description: string;
  deadline: string; // ISO 8601 date/time
  completed: boolean;
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Record<SourceReliability, SourceReliabilityDescriptor>;

export const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceDescriptor>;
```

## Functions

```
export function computeRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore
): RiskMatrixCell;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  owner: string;
  description: string;
  deadline: string;
  completed?: boolean;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date
): boolean;
```

## Notes

- All exports are pure utilities (no dependency on time except optional `referenceDate`).
- Functions must throw `Error` with descriptive messages for invalid likelihood/impact ranges or malformed deadlines.
- Builders must not edit this contract during implementation.
