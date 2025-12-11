# Contract: intel-standards

## Types

    export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityEntry {
      code: SourceReliabilityCode;
      title: string;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceDescriptor {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = LikelihoodLevel;

    export type RiskSeverity = "low" | "moderate" | "high" | "critical";

    export interface RiskCell {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number; // 1-25
      severity: RiskSeverity;
    }

    export type RiskMatrix = RiskCell[][]; // Five rows of five cells

    export type ActionStatus = "pending" | "in-progress" | "done";

    export interface ActionItem {
      action: string;
      owner: string;
      deadline: string; // ISO 8601 date
      status: ActionStatus;
      notes?: string;
    }

## Functions

    export function listSourceReliabilityScale(): SourceReliabilityEntry[];

    export function getSourceReliability(
      code: SourceReliabilityCode
    ): SourceReliabilityEntry;

    export function getConfidenceDescriptor(
      level: ConfidenceLevel
    ): ConfidenceDescriptor;

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): number;

    export function deriveRiskSeverity(score: number): RiskSeverity;

    export function createRiskCell(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskCell;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: {
      action: string;
      owner: string;
      deadline: string;
      status?: ActionStatus;
      notes?: string;
    }): ActionItem;

## Notes

- Deterministic, pure functions only.
- Builders must implement according to this contract without modification.
