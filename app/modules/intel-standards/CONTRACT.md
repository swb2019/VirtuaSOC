## Contract: intel-standards

### Types

```
export type SourceReliabilityRating = "A" | "B" | "C" | "D" | "E" | "F";

export interface SourceReliabilityDescriptor {
  rating: SourceReliabilityRating;
  label: string;
  description: string;
}

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ConfidenceDescriptor {
  level: ConfidenceLevel;
  description: string;
}

export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export interface RiskMatrixCell {
  likelihood: Likelihood;
  impact: Impact;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type ActionItemStatus = "pending" | "in_progress" | "complete";

export interface ActionItem {
  title: string;
  owner: string;
  deadline: string; // ISO 8601
  status: ActionItemStatus;
}
```

### Functions

```
export function describeSourceReliability(
  rating: SourceReliabilityRating
): SourceReliabilityDescriptor;

export function describeConfidence(
  level: ConfidenceLevel
): ConfidenceDescriptor;

export function createRiskMatrixCell(input: {
  likelihood: number;
  impact: number;
}): RiskMatrixCell;

export function calculateRiskScore(cell: RiskMatrixCell): number;

export function deriveRiskLevel(score: number): RiskLevel;

export function createActionItem(input: {
  title: string;
  owner: string;
  deadline: string;
  status?: ActionItemStatus;
}): ActionItem;
```

### Notes

- Module is pure/side-effect free.
- Helper functions should throw `Error` with clear messaging when validation fails.
