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
  score: number; // likelihood * impact
  band: RiskBand;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export type ActionItemStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date/time
  status: ActionItemStatus;
}
```

## Functions

```
export function describeSourceReliability(value: SourceReliability): string;

export function describeConfidence(value: ConfidenceLevel): string;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export const RISK_MATRIX: RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem;
```

## Notes

- All helpers are pure and synchronous.
- Validation errors throw `Error` with human-readable messages; no logging or IO.
- This contract is locked during the builder phase.
