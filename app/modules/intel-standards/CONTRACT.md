# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_RELIABILITY_MEANINGS: Record<SourceReliability, string>;

export function isSourceReliability(value: string): value is SourceReliability;

export type ConfidenceLevel = "high" | "moderate" | "low";
export const CONFIDENCE_LEVELS: ConfidenceLevel[];

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export type RiskLevel =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface RiskScore {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  level: RiskLevel;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): RiskScore;

export function buildRiskMatrix(): RiskScore[][];

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string; // ISO 8601
}

export function createActionItem(input: {
  action: string;
  owner: string;
  deadline: string | Date;
}): ActionItem;

export function isActionItemOverdue(
  item: ActionItem,
  now?: Date,
): boolean;
```

## Notes

- All exports are pure data or referentially transparent helpers.
- No IO, randomness, timers (aside from optional `Date` passed in) or network calls.
- Builders MUST keep this contract stable unless product/design updates require changes.
