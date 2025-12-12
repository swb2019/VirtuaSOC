# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliabilityCode,
  SourceReliabilityDescriptor
>;

export type ConfidenceLevel = "high" | "moderate" | "low";
export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high" | "critical";

export interface RiskAssessment {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  category: RiskCategory;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO-8601 string
}
```

## Functions

```
export function getSourceReliability(
  code: SourceReliabilityCode
): SourceReliabilityDescriptor;

export function createRiskAssessment(input: {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
}): RiskAssessment;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All exports are pure/value objects; no IO or randomness.
- Likelihood/impact validation must throw on values outside 1-5.
- Action item helper must throw when description/owner are blank or deadline is not a valid ISO timestamp.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
