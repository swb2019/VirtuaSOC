# Contract: intel-standards

## Purpose

Expose canonical intelligence-analysis primitives that other modules can import
without re-implementing or duplicating domain rules.

## Provided Interfaces

- `SourceReliability` union (`"A"`–`"F"`) with descriptions + helper lookup.
- `ConfidenceLevel` union (`"high" | "moderate" | "low"`) with descriptions.
- `LikelihoodLevel` and `ImpactLevel` unions (1–5).
- `RiskScore` object representing a single matrix cell.
- `calculateRiskScore(likelihood, impact)` pure helper.
- `buildRiskMatrix()` convenience builder returning 5×5 array of `RiskScore`.
- `ActionItem` interface (description, owner, deadline ISO string).
- `createActionItem(input)` validator/normalizer for `ActionItem`.

## Consumers

- Future generator, renderer, and delivery modules referencing ICD-203 / ISO-31000
  primitives.
- Product catalog definitions to assert each product declares mandatory elements.

## Non-Goals

- Persistence of action items or alerts.
- Scheduling logic, reminders, or tenant scoping.
- Integration with external services.

## Change Management

- Any change to enums or scoring scales requires updating spec/tests.
- All functions remain side-effect free to allow pure unit testing.
