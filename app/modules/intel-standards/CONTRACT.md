# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliabilityCode;
  label: string;
  description: string;
  guidance: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
  narrative: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact (1..25)
  band: "low" | "moderate" | "high" | "critical";
}

export type RiskMatrix = RiskScore[][]; // 5 rows x 5 columns

export type ActionStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO-8601 date string
  status: ActionStatus;
}
```

## Functions

```
export function getSourceReliability(
  code: SourceReliabilityCode
): SourceReliabilityEntry;

export function getConfidenceLevel(
  level: ConfidenceLevel
): ConfidenceDescriptor;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string;
  status?: ActionStatus;
}): ActionItem;
```

## Notes

- All helpers are pure and synchronous.
- Invalid inputs must throw `Error` instances with helpful messages.
- No external IO, logging, or randomness.
