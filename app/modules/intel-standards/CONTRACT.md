# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: Likelihood;
  impact: Impact;
  value: number; // 1-25
  category: "low" | "moderate" | "elevated" | "high" | "critical";
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskScore>>;

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Functions

```
export function describeSourceReliability(code: SourceReliability): string;

export function describeConfidence(level: ConfidenceLevel): string;

export function computeRiskScore(
  likelihood: Likelihood,
  impact: Impact
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string;
}): ActionItem;
```

## Notes

- All utilities are pure and deterministic.
- Validation errors SHOULD throw `Error` with human-readable messages.
- This contract is frozen for builders unless product requirements change.
