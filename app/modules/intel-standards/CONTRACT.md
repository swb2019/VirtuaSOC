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
      label: string;
      description: string;
    }

    export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
    export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

    export type RiskCategory =
      | "informational"
      | "low"
      | "moderate"
      | "high"
      | "critical";

    export interface RiskCell {
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      score: number;
      category: RiskCategory;
    }

    export type RiskMatrix = RiskCell[][]; // 5 likelihood rows x 5 impact columns

    export interface ActionItem {
      description: string;
      owner: string;
      deadline: string; // ISO 8601
    }

## Functions

    export function getSourceReliability(
      code: SourceReliabilityCode
    ): SourceReliabilityDefinition;

    export function listSourceReliability(): SourceReliabilityDefinition[];

    export function getConfidence(
      level: ConfidenceLevel
    ): ConfidenceDefinition;

    export function listConfidenceLevels(): ConfidenceDefinition[];

    export function calculateRiskScore(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): number;

    export function categorizeRisk(score: number): RiskCategory;

    export function evaluateRisk(
      likelihood: LikelihoodLevel,
      impact: ImpactLevel
    ): RiskCell;

    export function createRiskMatrix(): RiskMatrix;

    export function createActionItem(input: {
      description: string;
      owner: string;
      deadline: string; // accepts ISO 8601
    }): ActionItem;

## Notes

- All helpers are synchronous and pure (no IO, randomness, or timestamps).
- Consumers must treat returned objects as immutable value objects.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
