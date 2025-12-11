# Contract: intel-standards

## Types

    export type SourceReliabilityGrade = "A" | "B" | "C" | "D" | "E" | "F";

    export interface SourceReliabilityInfo {
      grade: SourceReliabilityGrade;
      description: string;
    }

    export type ConfidenceLevel = "high" | "moderate" | "low";

    export interface ConfidenceInfo {
      level: ConfidenceLevel;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = LikelihoodLevel;

    export type RiskSeverity = "minimal" | "low" | "moderate" | "high" | "critical";

    export interface RiskScore {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number;
      severity: RiskSeverity;
    }

    export interface RiskMatrixRow {
      likelihood: LikelihoodLevel;
      entries: RiskScore[];
    }

    export type RiskMatrix = RiskMatrixRow[];

    export type ActionItemStatus = "pending" | "in-progress" | "complete";

    export interface ActionItem {
      id: string;
      description: string;
      owner: string;
      deadline: string; // ISO 8601
      status: ActionItemStatus;
    }

    export interface ActionItemInput {
      description: string;
      owner: string;
      deadline: string | Date;
      status?: ActionItemStatus;
    }

## Functions

    export function describeSourceReliability(
      grade: SourceReliabilityGrade
    ): SourceReliabilityInfo;

    export function describeConfidenceLevel(
      level: ConfidenceLevel
    ): ConfidenceInfo;

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskScore;

    export function buildRiskMatrix(): RiskMatrix;

    export function createActionItem(input: ActionItemInput): ActionItem;

## Notes

- All helpers are pure and synchronous. Input validation is limited to range and
  deadline sanity checks; callers handle additional business constraints.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
