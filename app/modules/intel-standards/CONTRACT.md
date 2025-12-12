# Contract: intel-standards

## Types

    export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      grade: SourceReliabilityGrade;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceDescriptor {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskCategory = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number;
      category: RiskCategory;
    }

    export interface ActionItem {
      owner: string;
      description: string;
      deadline: string; // ISO 8601
    }

    export interface ActionItemInput {
      owner: string;
      description: string;
      deadline: string | Date;
    }

## Constants

    export const sourceReliabilityScale: SourceReliabilityDescriptor[];
    export const confidenceScale: ConfidenceDescriptor[];
    export const riskMatrix: RiskScore[][];

## Functions

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskScore;

    export function createActionItem(input: ActionItemInput): ActionItem;

    export function isActionItemDueSoon(
      item: ActionItem,
      withinDays: number,
      referenceDate?: Date
    ): boolean;

## Notes

- Pure computations only; no IO or external dependencies.
- Category thresholds are fixed and must remain aligned between
  implementation and tests.
- This contract is frozen for the Builder phase. Do not edit without
  explicit approval.
