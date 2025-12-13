# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // likelihood * impact
  band: RiskBand;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_DESCRIPTIONS: Record<SourceReliability, string>;
export const CONFIDENCE_ORDER: ConfidenceLevel[];
```

## Functions

```
export function describeSourceReliability(code: SourceReliability): string;

export function confidenceRank(level: ConfidenceLevel): number;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function createRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
}): ActionItem;
```

## Notes

- All helpers are pure and deterministic.
- No IO, logging, or network access is permitted in this module.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
