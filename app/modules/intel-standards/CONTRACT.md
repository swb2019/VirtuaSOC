# Contract: intel-standards

## Types

```
export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  grade: SourceReliabilityGrade;
  summary: string;
  guidance: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  definition: string;
  narrativeCue: string;
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export type RiskLevel = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: Likelihood;
  impact: Impact;
  score: number;
  level: RiskLevel;
}

export type RiskMatrix = RiskCell[][];

export type ActionItemStatus = "pending" | "in-progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 UTC string
  status: ActionItemStatus;
}
```

## Functions / Constants

```
export const sourceReliabilityScale: Record<SourceReliabilityGrade, SourceReliabilityDescriptor>;
export function describeSourceReliability(grade: SourceReliabilityGrade): SourceReliabilityDescriptor;

export const confidenceScale: Record<ConfidenceLevel, ConfidenceDescriptor>;
export function describeConfidence(level: ConfidenceLevel): ConfidenceDescriptor;

export function computeRiskScore(likelihood: Likelihood, impact: Impact): number;
export function deriveRiskLevel(score: number): RiskLevel;
export const riskMatrix: RiskMatrix;
export function getRiskCell(likelihood: Likelihood, impact: Impact): RiskCell;

export interface CreateActionItemInput {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}

export function createActionItem(input: CreateActionItemInput): ActionItem;
```

## Notes

- All helpers are synchronous, deterministic, and side-effect free.
- No IO, logging, or network interactions are allowed in this module.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
