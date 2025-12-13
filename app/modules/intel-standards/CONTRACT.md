# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliability {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export const SOURCE_RELIABILITY_SCALE: Record<SourceReliabilityCode, SourceReliability>;

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceMetadata {
  level: ConfidenceLevel;
  description: string;
}

export const CONFIDENCE_SCALE: Record<ConfidenceLevel, ConfidenceMetadata>;

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // likelihood * impact
  band: RiskBand;
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Functions

```
export function getSourceReliability(
  code: SourceReliabilityCode,
): SourceReliability;

export function getConfidence(level: ConfidenceLevel): ConfidenceMetadata;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function buildRiskMatrix(): RiskScore[][]; // rows ordered by likelihood asc, impact asc per row

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All functions are pure, synchronous, and deterministic.
- Inputs are validated; invalid values throw `Error` with human-readable messages.
- Module is in-memory only (no IO, logging, or randomness).
- This contract is frozen for the Builder phase.
