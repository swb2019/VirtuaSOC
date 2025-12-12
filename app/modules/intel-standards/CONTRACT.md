# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact (1-25)
  band: RiskBand;
}

export type RiskMatrixRow = RiskScore[]; // impact asc within a row
export type RiskMatrix = RiskMatrixRow[]; // likelihood asc across rows

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
}
```

## Functions

```
export function getSourceReliability(code: string): SourceReliabilityEntry;

export function assertConfidenceLevel(value: string): asserts value is ConfidenceLevel;

export function calculateRiskScore(
  likelihood: number,
  impact: number
): RiskScore;

export function generateRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All helpers are pure and deterministic (no IO, randomness, or timestamps).
- Validation helpers throw `TypeError` on invalid inputs to fail fast.
- Builders must not mutate the exported constants in-place; copy first if mutation is required elsewhere.
