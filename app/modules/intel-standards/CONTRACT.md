# Contract: intel-standards

## Types

    export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      code: SourceReliability;
      label: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export type Likelihood = 1 | 2 | 3 | 4 | 5;
    export type Impact = 1 | 2 | 3 | 4 | 5;

    export type RiskLevel = "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: Likelihood;
      impact: Impact;
      value: number;
      level: RiskLevel;
    }

    export interface RiskMatrix
      extends Readonly<Record<Likelihood, Readonly<Record<Impact, RiskScore>>>> {}

    export type ActionItemStatus = "pending" | "in_progress" | "done";

    export interface ActionItem {
      summary: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionItemStatus;
    }

## Constants

    export const SOURCE_RELIABILITY_SCALE: ReadonlyArray<SourceReliabilityDescriptor>;

    export const CONFIDENCE_LEVELS: ReadonlyArray<ConfidenceLevel>;

    export const RISK_MATRIX: RiskMatrix;

## Functions

    export function getSourceReliabilityDescriptor(
      code: SourceReliability
    ): SourceReliabilityDescriptor;

    export function isConfidenceLevel(value: unknown): value is ConfidenceLevel;

    export function calculateRiskScore(
      likelihood: Likelihood,
      impact: Impact
    ): RiskScore;

    export function createActionItem(input: {
      summary: string;
      owner: string;
      deadline: string;
      status?: ActionItemStatus;
    }): ActionItem;

## Notes

- All exports are deterministic and side-effect free.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
