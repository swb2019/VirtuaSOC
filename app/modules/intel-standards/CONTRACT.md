# Contract: intel-standards

## Types

```
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDefinition {
  code: SourceReliabilityCode;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDefinition {
  level: ConfidenceLevel;
  description: string;
  rank: number;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskRating = "low" | "moderate" | "high" | "extreme";

export interface RiskMatrixCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  rating: RiskRating;
}

export type RiskMatrix = ReadonlyArray<ReadonlyArray<RiskMatrixCell>>;

export interface ActionItem {
  id: string;
  owner: string;
  action: string;
  deadline: string; // ISO 8601
  status: "pending" | "completed";
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Readonly<Record<SourceReliabilityCode, SourceReliabilityDefinition>>;

export const CONFIDENCE_SCALE: Readonly<Record<ConfidenceLevel, ConfidenceDefinition>>;
```

## Functions

```
export function isSourceReliabilityCode(value: string): value is SourceReliabilityCode;

export function describeSourceReliability(code: SourceReliabilityCode): SourceReliabilityDefinition;

export function describeConfidence(level: ConfidenceLevel): ConfidenceDefinition;

export function compareConfidence(a: ConfidenceLevel, b: ConfidenceLevel): number;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): number;

export function classifyRisk(score: number): RiskRating;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  owner: string;
  action: string;
  deadline: string;
}): ActionItem;

export function completeActionItem(item: ActionItem): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date
): boolean;
```

## Notes

- All utilities are pure and side-effect free.
- Inputs are validated and normalized before returning values.
- This contract is FROZEN for the Builder phase.
