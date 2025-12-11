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

    export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
    export type ImpactScore = 1 | 2 | 3 | 4 | 5;

    export type RiskCategory = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodScore;
      impact: ImpactScore;
      value: number;
      category: RiskCategory;
    }

    export type RiskMatrixRow = ReadonlyArray<RiskScore>;
    export type RiskMatrix = ReadonlyArray<RiskMatrixRow>;

    export type ActionStatus = "pending" | "in_progress" | "completed";

    export interface ActionItem {
      action: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionStatus;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE:
      Readonly<Record<SourceReliabilityCode, SourceReliabilityDescriptor>>;

    export const CONFIDENCE_SCALE:
      Readonly<Record<ConfidenceLevel, ConfidenceDescriptor>>;

## Functions

    export function getSourceReliabilityInfo(
      code: SourceReliabilityCode
    ): SourceReliabilityDescriptor;

    export function getConfidenceInfo(
      level: ConfidenceLevel
    ): ConfidenceDescriptor;

    export function computeRiskScore(
      likelihood: LikelihoodScore,
      impact: ImpactScore
    ): RiskScore;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: {
      action: string;
      owner: string;
      deadline: string | Date;
      status?: ActionStatus;
    }): ActionItem;

## Notes

- Module must stay pure and deterministic (no IO or randomness).
- This contract is FROZEN for downstream builder work.
