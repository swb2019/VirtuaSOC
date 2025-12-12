# Contract: intel-standards

## Types

```
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

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type RiskSeverity =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  score: number; // 1-25
  severity: RiskSeverity;
}

export type RiskMatrix = RiskScore[][]; // 5 rows, 5 columns

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601 UTC
  status: ActionItemStatus;
}
```

## Functions

```
export function calculateRiskScore(
  likelihood: LikelihoodScore,
  impact: ImpactScore
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem;
```

## Notes

- Module is pure data/logic only (no IO, timers, logging, or randomness beyond Date validation).
- Return values must be immutable snapshots; callers are expected to copy if they need mutation.
- This contract is frozen for builders; extension requires new backlog work.
