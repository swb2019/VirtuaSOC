# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliability {
  code: SourceReliabilityCode;
  description: string;
}

export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type RiskAxisValue = 1 | 2 | 3 | 4 | 5;
export type RiskSeverity = "low" | "moderate" | "high" | "critical";

export interface RiskAssessment {
  likelihood: RiskAxisValue;
  impact: RiskAxisValue;
  riskScore: number;
  severity: RiskSeverity;
}

export interface ActionItem {
  owner: string;
  action: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[];
export const CONFIDENCE_SCALE: readonly ConfidenceDescriptor[];
```

## Functions

```
export function createSourceReliability(code: string): SourceReliability;

export function createConfidence(level: string): ConfidenceDescriptor;

export function createRiskAssessment(input: {
  likelihood: number;
  impact: number;
}): RiskAssessment;

export function createActionItem(input: {
  owner: string;
  action: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All helpers are deterministic and side-effect free.
- Inputs are validated; invalid values throw `Error` with descriptive messages.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
