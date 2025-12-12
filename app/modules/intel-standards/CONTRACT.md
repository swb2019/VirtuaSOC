# Contract: intel-standards

## Types

    export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      code: SourceReliability;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskLevel = "minimal" | "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      value: number; // 1-25 (likelihood x impact)
      level: RiskLevel;
    }

    export interface ActionItem {
      action: string;
      owner: string;
      deadline: string; // ISO 8601
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: Readonly<
      Record<SourceReliability, SourceReliabilityDescriptor>
    >;

    export const CONFIDENCE_ORDER: readonly ConfidenceLevel[];

    export const RISK_MATRIX: ReadonlyArray<ReadonlyArray<RiskLevel>>;

## Functions

    export function describeSourceReliability(
      reliability: SourceReliability
    ): SourceReliabilityDescriptor;

    export function confidenceRank(level: ConfidenceLevel): number;

    export function computeRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskScore;

    export function createActionItem(input: {
      action: string;
      owner: string;
      deadline: string;
    }): ActionItem;

## Notes

- All utilities are pure functions with no IO.
- `createActionItem` throws if fields are empty or deadline is invalid.
- This contract is frozen for builders once published.

