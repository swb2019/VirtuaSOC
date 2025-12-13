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

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact
  band: RiskBand;
}

export interface RiskCell extends RiskScore {}

export type RiskMatrix = RiskCell[][]; // 5 rows (likelihood), 5 cols (impact)

export type ActionItemStatus = "open" | "in-progress" | "done";

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601 date
  status: ActionItemStatus;
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[];
export const CONFIDENCE_SCALE: readonly ConfidenceDescriptor[];
```

## Functions

```
export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601
  status?: ActionItemStatus;
}): ActionItem;
```

## Notes

- All exports are pure data helpers; no IO allowed.
- Builders must not mutate the exported scale arrays.
- This contract is FROZEN for the Builder phase.
