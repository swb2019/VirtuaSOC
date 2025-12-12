# Contract: intel-standards

## Types

    export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityMetadata {
      code: SourceReliability;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceMetadata {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskTier = "minimal" | "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      value: number; // 1-25 (likelihood * impact)
      tier: RiskTier;
    }

    export interface RiskCell extends RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
    }

    export interface ActionItem {
      summary: string;
      owner: string;
      deadline: string; // ISO 8601 date or datetime
    }

## Constants & Functions

    export const SOURCE_RELIABILITY_SCALE: Record<
      SourceReliability,
      SourceReliabilityMetadata
    >;

    export const CONFIDENCE_SCALE: Record<
      ConfidenceLevel,
      ConfidenceMetadata
    >;

    export class RiskMatrix {
      static readonly MIN_LEVEL: LikelihoodLevel;
      static readonly MAX_LEVEL: LikelihoodLevel;

      static computeScore(
        likelihood: LikelihoodLevel,
        impact: ImpactLevel
      ): RiskScore;

      static getCell(
        likelihood: LikelihoodLevel,
        impact: ImpactLevel
      ): RiskCell;

      static build(): RiskCell[][];
    }

    export function createActionItem(input: ActionItem): ActionItem;

## Notes

- All helpers are pure and deterministic.
- Validation errors should be thrown as `Error` instances with descriptive
  messages; no console logging.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
