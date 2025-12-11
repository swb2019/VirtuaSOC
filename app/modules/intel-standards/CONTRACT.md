# Contract: intel-standards

## Types

```ts
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  meaning: string;
  guidance: string;
}

export type ConfidenceLevel = "low" | "moderate" | "high";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  value: number; // 1-25
  level: RiskLevel;
}

export type RiskMatrix = RiskScore[][];

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface ActionItemInput {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
  status?: ActionItemStatus;
}

export interface ActionItem {
  description: string;
  owner: string;
  deadline: string; // ISO 8601 string
  status: ActionItemStatus;
}
```

## Constants

```ts
export const SOURCE_RELIABILITY_SCALE: Readonly<
  Record<SourceReliability, SourceReliabilityDescriptor>
>;
```

## Functions

```ts
export function describeSourceReliability(
  code: SourceReliability
): SourceReliabilityDescriptor;

export function compareConfidence(
  a: ConfidenceLevel,
  b: ConfidenceLevel
): -1 | 0 | 1;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function buildRiskMatrix(): RiskMatrix;

export function createActionItem(input: ActionItemInput): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  referenceDate?: Date
): boolean;
```

## Notes

- All helpers are pure and synchronous.
- Inputs are validated; invalid likelihood/impact values throw.
- `createActionItem` trims string fields and validates deadline is a valid date.
- Builders must not edit this contract during the implementation phase.
