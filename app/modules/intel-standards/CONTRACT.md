# Contract: intel-standards

## Types

```
export type SourceReliability = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  code: SourceReliability;
  title: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;
export type RiskScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25;

export type RiskRating = "low" | "moderate" | "high" | "critical";

export interface RiskCell {
  likelihood: Likelihood;
  impact: Impact;
  score: RiskScore;
  rating: RiskRating;
}

export interface RiskMatrix {
  cells: RiskCell[]; // exactly 25 cells, one for every likelihood/impact pair
}

export interface ActionItem {
  summary: string;
  owner: string;
  deadline: string; // ISO 8601 date string
}
```

## Constants

```
export const SOURCE_RELIABILITY_SCALE: Record<SourceReliability, SourceReliabilityDescriptor>;

export const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceDescriptor>;
```

## Functions

```
export function createRiskMatrix(): RiskMatrix;

export function calculateRiskScore(likelihood: Likelihood, impact: Impact): RiskScore;

export function classifyRisk(score: RiskScore): RiskRating;

export function createActionItem(input: {
  summary: string;
  owner: string;
  deadline: string | Date;
}): ActionItem;
```

## Notes

- All utilities are deterministic, pure, and side-effect free.
- Invalid likelihood/impact inputs throw informative `Error`s.
- Action items sanitize whitespace and always output ISO 8601 deadlines.
- This contract is frozen for builders once the module is implemented.
