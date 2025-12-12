# Module: intel-standards

## Goal

Provide canonical domain primitives for intelligence standards such as
source reliability, analytic confidence, and risk scoring so higher-level
pipelines can reason about assessments consistently.

## Scope

- Define immutable enumerations for:
  - Source reliability grades (A-F, AF scale).
  - Confidence levels (High/Moderate/Low).
- Provide a 5x5 risk matrix abstraction that maps likelihood x impact to a
  derived numeric risk score (1-25) consistent with ISO-31000 style framing.
- Represent action items (owner + deadline + description) and provide helper
  utilities for working with deadlines.
- Keep implementation dependency-free and pure.

Out of scope: persistence, scheduling logic, network IO, or integrations.

## Acceptance Criteria

- [ ] `SourceReliability` type includes grades `A` through `F` with
      descriptions accessible in code.
- [ ] `ConfidenceLevel` type models `high`, `moderate`, and `low` with a
      comparable ordering helper.
- [ ] `RiskMatrix` exposes a strongly typed 5x5 grid for likelihood (1-5) and
      impact (1-5) and a helper `getRiskScore(likelihood, impact)` that returns
      the derived numeric value.
- [ ] `RiskScore` helper returns the numeric score plus a qualitative label
      (e.g., `low`, `moderate`, `high`) based on configurable thresholds.
- [ ] `ActionItem` captures description, owner, and deadline (ISO string) and a
      helper `isActionItemOverdue(action, referenceDate?)` evaluates deadline
      against the supplied or current date.
- [ ] Unit tests cover all exported helpers, especially boundary values for
      the risk matrix and overdue detection.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure in-memory logic; no secrets or IO.
- Deadlines are handled as ISO strings; parsing must tolerate invalid input by
  returning `false` rather than throwing.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
