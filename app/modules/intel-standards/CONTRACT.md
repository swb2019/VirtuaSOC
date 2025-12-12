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

export interface ConfidenceEntry {
  level: ConfidenceLevel;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "low" | "moderate" | "substantial" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // product of likelihood * impact
  band: RiskBand;
}

export type RiskMatrix = RiskScore[][];

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601
  status: "pending" | "in-progress" | "done";
}
```

## Functions

```
export function describeSourceReliability(
  code: SourceReliabilityCode
): SourceReliabilityEntry;

export function describeConfidenceLevel(
  level: ConfidenceLevel
): ConfidenceEntry;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string;
  status?: ActionItem["status"];
}): ActionItem;
```

## Notes

- The module is pure and has no IO or network dependencies.
- Builders must keep descriptions aligned with ICD-203 / ISO-31000 guidance.
