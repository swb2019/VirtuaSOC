# Contract: intel-standards

## Types

    export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityDescriptor {
      code: SourceReliability;
      title: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskBand = "low" | "moderate" | "high" | "severe" | "critical";

    export interface RiskCell {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number;
      band: RiskBand;
    }

    export type RiskMatrix = RiskCell[][];

    export type ActionStatus = "pending" | "in_progress" | "complete";

    export interface ActionItem {
      title: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionStatus;
    }

## Functions

    export function describeSourceReliability(
      code: SourceReliability
    ): SourceReliabilityDescriptor;

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): number;

    export function riskBandForScore(score: number): RiskBand;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: {
      title: string;
      owner: string;
      deadline: string;
      status?: ActionStatus;
    }): ActionItem;

## Notes

- Values and helpers are deterministic and pure.
- No IO, system time, or randomness in this module.
- This contract is FROZEN for the Builder phase.
