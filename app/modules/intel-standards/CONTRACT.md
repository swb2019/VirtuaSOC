# Contract: intel-standards

## Types

```ts
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;
export type RiskScore =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15
  | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25;

export type RiskClassification = "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: Likelihood;
  impact: Impact;
  score: RiskScore;
  classification: RiskClassification;
}

export type RiskMatrix = RiskMatrixCell[][];

export type ActionItemStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}
```

## Constants

```ts
export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
>;

export const CONFIDENCE_SCALE: Readonly<
  Record<ConfidenceLevel, ConfidenceDescriptor>
>;
```

## Functions

```ts
export function describeSourceReliability(
  code: SourceReliability,
): SourceReliabilityDescriptor;

export function describeConfidence(
  level: ConfidenceLevel,
): ConfidenceDescriptor;

export function calculateRiskScore(
  likelihood: Likelihood,
  impact: Impact,
): RiskScore;

export function classifyRisk(score: RiskScore): RiskClassification;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem;
```

## Notes

- All exports are pure and deterministic.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
