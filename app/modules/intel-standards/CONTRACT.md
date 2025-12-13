# Contract: intel-standards

## Types

    export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityEntry {
      code: SourceReliabilityCode;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export type RiskAxisValue = 1 | 2 | 3 | 4 | 5;

    export type RiskBand = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: RiskAxisValue;
      impact: RiskAxisValue;
      score: number;
      band: RiskBand;
    }

    export type ActionItemStatus = "pending" | "in-progress" | "complete";

    export interface ActionItem {
      label: string;
      owner: string;
      deadline: string; // ISO 8601 string
      status: ActionItemStatus;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: Readonly<
      Record<SourceReliabilityCode, SourceReliabilityEntry>
    >;

    export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[];

    export const RISK_MATRIX: readonly (readonly RiskScore[])[];

## Functions

    export function calculateRiskScore(
      likelihood: RiskAxisValue,
      impact: RiskAxisValue
    ): RiskScore;

    export function createActionItem(input: {
      label: string;
      owner: string;
      deadline: string;
      status?: ActionItemStatus;
    }): ActionItem;

## Notes

- All exports are pure, deterministic, and safe to share across services.
- This contract is frozen for builders.
