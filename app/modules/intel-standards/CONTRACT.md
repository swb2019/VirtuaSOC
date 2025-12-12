# Contract: intel-standards

## Overview

This module exposes pure TypeScript primitives that represent common analytic
standards. Callers can import the module to retrieve canonical metadata
(descriptors) or to construct validated records.

## Exports

```ts
export type SourceReliabilityCode = "A" | "B" | "C" | "D" | "E" | "F";
export interface SourceReliabilityDescriptor {
  code: SourceReliabilityCode;
  label: string;
  description: string;
  guidance: string;
  weight: number; // lower is better
}

export function describeSourceReliability(
  code: SourceReliabilityCode,
): SourceReliabilityDescriptor;

export function listSourceReliabilityScale(): SourceReliabilityDescriptor[];
```

```ts
export type ConfidenceLevel = "high" | "moderate" | "low";
export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

export function describeConfidence(
  level: ConfidenceLevel,
): ConfidenceDescriptor;

export function listConfidenceLevels(): ConfidenceDescriptor[];
```

```ts
export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "critical";

export interface RiskAxisLevel<T extends number> {
  value: T;
  label: string;
  description: string;
}

export interface RiskCell {
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  score: number;
  band: RiskBand;
}

export function calculateRiskScore(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): number;

export function classifyRisk(score: number): RiskBand;

export function buildRiskMatrix(): RiskCell[][];
```

```ts
export type ActionStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  owner: string;
  summary: string;
  deadline: string; // ISO8601
  status: ActionStatus;
}

export interface CreateActionItemInput {
  owner: string;
  summary: string;
  deadline: string | Date;
  status?: ActionStatus;
}

export function createActionItem(input: CreateActionItemInput): ActionItem;
```

## Expectations

- All functions are pure. No global state or randomness.
- Invalid inputs (empty owner/summary, malformed deadline string) throw
  descriptive errors.
- Consumers can rely on deterministic ordering: source reliability list is A→F,
  confidence list is High→Moderate→Low, risk matrix rows ascend by likelihood,
  columns ascend by impact.
