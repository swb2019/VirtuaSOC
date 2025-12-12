# Module: intel-standards

## Goal

Provide immutable domain primitives that encode mandated intelligence standards
(analytic tradecraft scales, risk scoring, and action tracking) so other modules
can reason about products without duplicating constants.

## Scope

- Source reliability scale (codes A-F) with human-readable definitions.
- Confidence levels (High, Moderate, Low) and descriptors per ICD-203.
- 5x5 risk matrix helpers (likelihood/impact 1-5) + deterministic risk score
  calculation.
- Action item abstraction with owner + deadline metadata.
- Pure utilities only; no IO, persistence, or framework dependencies.

## Acceptance Criteria

- [ ] Export `SourceReliabilityCode` union, descriptor type, and lookup helpers
      for all codes A-F.
- [ ] Export `ConfidenceLevel` union, descriptor type, and lookup helpers for
      all levels High/Moderate/Low.
- [ ] Provide `calculateRiskScore(likelihood, impact)` returning a score between
      1 and 25 (likelihood * impact) with inputs restricted to 1-5 totals.
- [ ] Provide `createRiskMatrix()` that produces a 5x5 immutable matrix of risk
      cells ordered by likelihood (rows) and impact (columns).
- [ ] Define `ActionItem` interface requiring `description`, `owner`, and ISO
      `deadline`, plus `createActionItem` helper that trims inputs and validates
      the deadline.
- [ ] Unit tests cover:
      - All reliability + confidence lookups.
      - Risk score boundaries and matrix shape.
      - Action item creation + validation failures.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or network calls.
- Validation errors must be surfaced synchronously via thrown Errors so caller
  can audit invalid inputs.
- All helpers must be deterministic and side-effect free.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
