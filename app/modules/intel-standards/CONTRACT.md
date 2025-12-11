# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface RiskMatrixInput {
  likelihood: number; // integer 1-5
  impact: number; // integer 1-5
}

export type RiskBand = "negligible" | "guarded" | "elevated" | "critical" | "catastrophic";

export interface RiskAssessment extends RiskMatrixInput {
  score: number; // likelihood * impact
  band: RiskBand;
}

export interface ActionItem {
  owner: string;
  task: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string>;

export const CONFIDENCE_LEVEL_DESCRIPTIONS: Record<ConfidenceLevel, string>;
```

## Functions

```
export function isSourceReliability(value: string): value is SourceReliability;

export function describeSourceReliability(code: SourceReliability): string;

export function isConfidenceLevel(value: string): value is ConfidenceLevel;

export function describeConfidenceLevel(level: ConfidenceLevel): string;

export function evaluateRiskMatrix(input: RiskMatrixInput): RiskAssessment;

export function createActionItem(input: {
  owner: string;
  task: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All helpers are pure, synchronous, and deterministic.
- Validation errors throw `Error` with human-readable messages (no custom classes yet).
- CONTRACT is frozen for builders; do not edit outside Autopilot planning.
