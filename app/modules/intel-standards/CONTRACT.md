# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  level: SourceReliability;
  description: string;
}

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

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
}

export interface RiskMatrix {
  cells: RiskMatrixCell[]; // ordered by likelihood asc, then impact asc
  getCell(likelihood: LikelihoodLevel, impact: ImpactLevel): RiskMatrixCell | undefined;
}

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 date string
  status: ActionItemStatus;
}
```

## Functions

```
export function describeSourceReliability(level: SourceReliability): string;

export function confidenceFromProbability(probability: number): ConfidenceLevel;

export function computeRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function createRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  description: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean;
```

## Notes

- All helpers are pure and deterministic. No IO, randomness, or logging.
- Inputs are validated and descriptive errors are thrown when violating the contract.
- Deadlines are normalized to ISO 8601 date-time strings (UTC) when created.
