# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (reliability, confidence, risk, and action tracking) that other VirtuaSOC modules can reuse without duplicating business rules.

## Scope

- Enumerations for AF reliability scale and confidence levels.
- Derivation of risk scores from the 5x5 likelihood/impact grid, including qualitative buckets.
- Helpers for constructing a canonical risk matrix view.
- Action item structure with basic validation and overdue detection.
- Pure TypeScript: no IO, persistence, or framework bindings.

## Acceptance Criteria

- [ ] `SourceReliability` is a union of "A" through "F" with descriptive labels exposed via `SOURCE_RELIABILITY_SCALE`.
- [ ] `ConfidenceLevel` is a union of `"high" | "moderate" | "low"` with an ordered tuple export for reuse.
- [ ] Risk helpers expose `calculateRiskScore(likelihood, impact)` returning value (1-25) plus qualitative bucket, and `buildRiskMatrix()` creates a 5x5 matrix covering every likelihood/impact pair exactly once.
- [ ] Likelihood/impact levels are typed as `1 | 2 | 3 | 4 | 5` and validated in helpers.
- [ ] `ActionItem` includes `description`, `owner`, `deadline`, and `status` (default `pending`). `createActionItem` enforces non-empty strings and ISO deadlines; `isActionItemOverdue` detects past-due items unless status is `complete`.
- [ ] Vitest unit tests cover reliability/ confidence enumerations, risk score math, matrix shape, and action item helpers.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure functions only; no secrets, filesystem, or network access.
- All timestamps are ISO 8601 strings for auditability.
- Deterministic calculations to keep outputs easily testable.

## Test Plan

- Implement Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts`.
