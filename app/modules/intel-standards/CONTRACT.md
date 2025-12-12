# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityEntry {
  code: SourceReliability;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number;
  rating: RiskRating;
}

export type RiskMatrix = RiskScore[][]; // 5 rows x 5 columns

export interface ActionItem {
  task: string;
  owner: string;
  deadline: string; // ISO 8601
  status: "pending" | "in_progress" | "completed";
  notes?: string;
}

export interface ActionItemInput {
  task: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItem["status"];
  notes?: string;
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Record<
  SourceReliability,
  SourceReliabilityEntry
>;

export const CONFIDENCE_DESCRIPTORS: Record<
  ConfidenceLevel,
  ConfidenceDescriptor
>;
```

## Functions

```
export function deriveRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function createRiskMatrix(): RiskMatrix;

export function createActionItem(input: ActionItemInput): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date | string,
): boolean;
```

## Notes

- All helpers are pure and have no side effects.
- Inputs are validated; invalid likelihood/impact throw `RangeError`.
- Contract is frozen for builders.
