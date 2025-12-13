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

export type RiskRating = "low" | "moderate" | "high" | "critical";
export type RiskScore = number;

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: RiskScore;
  rating: RiskRating;
}

export interface RiskRatingThresholds {
  lowMax: number;
  moderateMax: number;
  highMax: number;
}

export type RiskMatrix = RiskCell[][];

export interface ActionItem {
  title: string;
  owner: string;
  deadline: string; // ISO 8601
  status: "pending" | "in-progress" | "complete";
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE:
  Record<SourceReliabilityCode, SourceReliabilityDescriptor>;

export const CONFIDENCE_SCALE:
  Record<ConfidenceLevel, ConfidenceDescriptor>;

export const DEFAULT_RISK_THRESHOLDS: RiskRatingThresholds;
```

## Functions

```
export function getSourceReliabilityDescriptor(
  code: SourceReliabilityCode
): SourceReliabilityDescriptor;

export function getConfidenceDescriptor(
  level: ConfidenceLevel
): ConfidenceDescriptor;

export function evaluateRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
  thresholds?: RiskRatingThresholds
): RiskCell;

export function createRiskMatrix(
  thresholds?: RiskRatingThresholds
): RiskMatrix;

export function createActionItem(input: {
  title: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItem["status"];
}): ActionItem;

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: Date
): boolean;
```

## Notes

- All helpers are deterministic and side-effect free.
- Deadlines are stored as ISO 8601 strings for cross-service compatibility.
- Threshold validation should throw if inputs are out of order or outside 1-25.
