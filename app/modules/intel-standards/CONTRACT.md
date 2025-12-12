# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskScore = number;

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskCell>>;

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[];
export const CONFIDENCE_LEVELS: readonly ConfidenceDescriptor[];
```

## Functions

```
export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor;

export function getConfidenceDescriptor(
  level: ConfidenceLevel,
): ConfidenceDescriptor;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function createRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All exports are pure + side-effect free.
- Validation errors must throw `Error` with human-readable message.
- This contract is frozen for builders.
