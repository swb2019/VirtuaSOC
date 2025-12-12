# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDetail {
  level: SourceReliability;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "minimal" | "low" | "moderate" | "high" | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number; // likelihood * impact
  band: RiskBand;
}

export type RiskMatrix = RiskScore[][]; // [likelihood][impact]

export type ActionItemStatus = "pending" | "in_progress" | "done";

export interface ActionItem {
  id: string;
  action: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
  notes?: string;
}
```

## Functions

```
export function describeSourceReliability(level: SourceReliability): SourceReliabilityDetail;

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): RiskScore;

export function generateRiskMatrix(): RiskMatrix;

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
  status?: ActionItemStatus;
  notes?: string;
  idFactory?: () => string;
}): ActionItem;

export function updateActionItemStatus(
  item: ActionItem,
  status: ActionItemStatus
): ActionItem;
```

## Notes

- All helpers must be pure and side-effect free.
- The contract is frozen for builders; update only via backlog direction.
