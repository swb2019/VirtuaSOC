# Contract: intel-standards

## Types

    export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

    export const SOURCE_RELIABILITY_DESCRIPTORS: Record<SourceReliability, string>;

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export const CONFIDENCE_LEVEL_DESCRIPTORS: Record<ConfidenceLevel, string>;

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;

    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskRating = "low" | "moderate" | "high" | "critical";

    export interface RiskCell {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number; // likelihood × impact, 1-25
      rating: RiskRating;
    }

    export type RiskMatrix = RiskCell[][]; // indexed by likelihood rows, impact columns

    export interface ActionItem {
      summary: string;
      owner: string;
      deadline: string; // ISO 8601 date
    }

## Functions

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskCell;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: ActionItem): ActionItem;

## Notes

- All exports are pure and side-effect free.
- Descriptor records must always include every enum value.
- `createActionItem` validates `owner` (non-empty) and `deadline` (valid ISO 8601).
- Builders must not modify this contract; it is frozen for the current phase.
