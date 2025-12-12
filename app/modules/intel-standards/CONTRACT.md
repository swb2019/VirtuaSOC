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
  definition: string;
}

export type RiskValue = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskMatrixCell {
  likelihood: RiskValue;
  impact: RiskValue;
  score: number;
  band: RiskBand;
}

export type RiskMatrix = RiskMatrixCell[][];

export interface ActionItem {
  owner: string;
  description: string;
  deadline: string; // ISO 8601 date
  status: "planned" | "in_progress" | "done";
}
```

## Functions

```
export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor;

export function describeConfidenceLevel(
  level: ConfidenceLevel,
): ConfidenceDescriptor;

export function calculateRiskScore(
  likelihood: RiskValue,
  impact: RiskValue,
): number;

export function determineRiskBand(score: number): RiskBand;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  owner: string;
  description: string;
  deadline: string;
  status?: ActionItem["status"];
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date,
): boolean;
```

## Notes

- Pure functions only; no randomness, IO, or logging.
- Validation errors should throw `Error` with actionable messages.
- This contract is frozen for builders implementing intel-standards.
