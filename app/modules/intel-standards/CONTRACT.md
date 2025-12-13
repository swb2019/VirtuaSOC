# Contract: intel-standards

## Types

    export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      grade: SourceReliabilityGrade;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceDescriptor {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodRating = 1 | 2 | 3 | 4 | 5;
    export type ImpactRating = 1 | 2 | 3 | 4 | 5;
    export type RiskCategory = "low" | "moderate" | "high";

    export interface RiskMatrixCell {
      likelihood: LikelihoodRating;
      impact: ImpactRating;
    }

    export interface RiskScore {
      likelihood: LikelihoodRating;
      impact: ImpactRating;
      value: number;
      category: RiskCategory;
    }

    export type RiskMatrix = readonly RiskCategory[][];

    export type ActionItemStatus = "planned" | "in_progress" | "done";

    export interface ActionItem {
      description: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionItemStatus;
    }

    export interface ActionItemInput {
      description: string;
      owner: string;
      deadline: string;
      status?: ActionItemStatus;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: Record<
      SourceReliabilityGrade,
      SourceReliabilityDescriptor
    >;

    export const CONFIDENCE_LEVELS: Record<
      ConfidenceLevel,
      ConfidenceDescriptor
    >;

    export const RISK_MATRIX: RiskMatrix;

## Functions

    export function getSourceReliabilityDescriptor(
      grade: SourceReliabilityGrade
    ): SourceReliabilityDescriptor;

    export function deriveRiskScore(cell: RiskMatrixCell): RiskScore;

    export function createActionItem(input: ActionItemInput): ActionItem;

    export function isIsoDateString(value: string): boolean;

## Notes

- Module is pure/side-effect free and does not access IO.
- This contract is frozen during the Builder phase; do not edit without PM
  direction.
