# Contract: intel-standards

## Types

    export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      grade: SourceReliabilityGrade;
      meaning: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceDescriptor {
      level: ConfidenceLevel;
      meaning: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskCategory = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number; // 1-25
      category: RiskCategory;
    }

    export type RiskMatrix = RiskScore[][];

    export type ActionStatus = "planned" | "in_progress" | "done";

    export interface ActionItem {
      action: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionStatus;
    }

    export interface ActionItemInput {
      action: string;
      owner: string;
      deadline: string;
      status?: ActionStatus;
    }

## Functions & Constants

    export const SOURCE_RELIABILITY_SCALE: Record<
      SourceReliabilityGrade,
      SourceReliabilityDescriptor
    >;

    export function getSourceReliability(
      grade: SourceReliabilityGrade
    ): SourceReliabilityDescriptor;

    export const CONFIDENCE_SCALE: Record<
      ConfidenceLevel,
      ConfidenceDescriptor
    >;

    export function getConfidenceDescriptor(
      level: ConfidenceLevel
    ): ConfidenceDescriptor;

    export function deriveRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskScore;

    export const RISK_MATRIX: RiskMatrix;

    export function createActionItem(input: ActionItemInput): ActionItem;

## Notes

- Module is pure TypeScript. No IO, logging, or randomness.
- Validation errors throw synchronously to the caller.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
