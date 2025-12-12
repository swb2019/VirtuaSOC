# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  title: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = "low" | "moderate" | "high";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // 1-25
  category: RiskCategory;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
>;

export const CONFIDENCE_ORDER: Readonly<ConfidenceLevel[]>;

export const RISK_MATRIX: Readonly<
  Record<LikelihoodLevel, Readonly<Record<ImpactLevel, number>>>
>;
```

## Functions

```
export function describeSourceReliability(
  grade: SourceReliability,
): SourceReliabilityDescriptor;

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel,
): number;

export function getRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number;

export function assessRisk(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function isActionItemOverdue(
  action: ActionItem,
  referenceDate?: Date | string,
): boolean;
```

## Notes

- All helpers are synchronous and side-effect free.
- Date parsing in `isActionItemOverdue` must be resilient: invalid dates should
  return `false` (treat as not overdue) instead of throwing.
- This contract is frozen for the Builder phase.
