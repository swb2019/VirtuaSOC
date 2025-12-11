# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskScore =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15
  | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25;

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export type RiskMatrix = RiskMatrixCell[][]; // rows ordered by likelihood ascending.

export type ActionStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionStatus;
}
```

## Functions

```
export function ensureSourceReliability(value: string): SourceReliability;

export function ensureConfidenceLevel(value: string): ConfidenceLevel;

export function ensureLikelihood(value: number): LikelihoodLevel;

export function ensureImpact(value: number): ImpactLevel;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function createRiskMatrixCell(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskMatrixCell;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem;
```

## Notes

- Module must remain pure and deterministic with no IO.
- Builders may extend implementation but must keep this contract stable.
- Validation errors should use `Error` with human-readable but non-sensitive messages.
