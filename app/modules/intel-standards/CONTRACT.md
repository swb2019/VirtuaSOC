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

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export interface RiskCell {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  score: number; // likelihood * impact
}

export type RiskMatrix = RiskCell[][]; // always 5 x 5

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: "pending" | "in-progress" | "complete";
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Record<SourceReliabilityCode, SourceReliabilityDescriptor>;

export const CONFIDENCE_DESCRIPTORS: Record<ConfidenceLevel, ConfidenceDescriptor>;
```

## Functions

```
export function deriveRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore
): number;

export function createRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItem["status"];
}): ActionItem;
```

## Notes

- All helpers are pure and synchronous.
- Inputs are validated; invalid codes or deadline formats throw errors.
- This contract is frozen for builders; do not edit without product approval.
