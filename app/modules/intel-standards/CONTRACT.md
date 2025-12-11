# Contract: intel-standards

## Types

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

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number;
      rating: RiskRating;
    }

    export type RiskMatrix = RiskScore[][];

    export interface ActionItem {
      action: string;
      owner: string;
      deadline: string; // ISO 8601
    }

    export interface ActionItemInput {
      action: string;
      owner: string;
      deadline: string | Date;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: readonly SourceReliabilityDescriptor[];

    export const CONFIDENCE_SCALE: readonly ConfidenceDescriptor[];

## Functions

    export function describeSourceReliability(
      code: SourceReliabilityCode
    ): SourceReliabilityDescriptor;

    export function describeConfidence(
      level: ConfidenceLevel
    ): ConfidenceDescriptor;

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): number;

    export function deriveRiskRating(score: number): RiskRating;

    export function createRiskMatrix(): RiskMatrix;

    export function createActionItem(input: ActionItemInput): ActionItem;

## Notes

- Functions are pure, synchronous, and deterministic.
- No IO, logging, or external dependencies are allowed.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
