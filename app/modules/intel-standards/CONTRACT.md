# Contract: intel-standards

## Types

    export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDefinition {
      code: SourceReliabilityCode;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceDefinition {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskClassification = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      value: number;
      classification: RiskClassification;
    }

    export type RiskMatrix = RiskScore[][];

    export type ActionStatus = "planned" | "in_progress" | "done";

    export interface ActionItem {
      summary: string;
      owner: string;
      deadline: string; // ISO 8601 date string
      status: ActionStatus;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: Record<
      SourceReliabilityCode,
      SourceReliabilityDefinition
    >;

    export const CONFIDENCE_SCALE: Record<
      ConfidenceLevel,
      ConfidenceDefinition
    >;

## Functions

    export function getSourceReliabilityDefinition(
      code: SourceReliabilityCode
    ): SourceReliabilityDefinition;

    export function getConfidenceDefinition(
      level: ConfidenceLevel
    ): ConfidenceDefinition;

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskScore;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: {
      summary: string;
      owner: string;
      deadline: string;
      status?: ActionStatus;
    }): ActionItem;

## Notes

- Deterministic, pure helpers only.
- No IO, randomness, logging, or external dependencies.
- This contract is frozen for builders; do not modify without aligning specs.
