# Module: intel-standards

## Goal

Codify intelligence community assessment primitives (source reliability, confidence, risk, and action tracking) so other modules can share consistent terminology and scoring.

## Scope

- Immutable enums/type aliases for AF source reliability (A-F) and confidence (High/Moderate/Low).
- Risk matrix helpers that cover the full 5x5 (likelihood x impact) grid and compute a qualitative risk score.
- Lightweight ActionItem helper for owner/deadline tracking with ISO 8601 deadlines.
- No persistence, IO, or vendor integrations.

## Acceptance Criteria

- [ ] `SourceReliability` includes values `"A"` through `"F"` with helper that returns canonical descriptions.
- [ ] `ConfidenceLevel` exposes `"high" | "moderate" | "low"` and a validator helper.
- [ ] `calculateRiskScore(likelihood, impact)` validates both inputs (1-5), returns score + qualitative tier, and `buildRiskMatrix()` returns the 5x5 grid.
- [ ] `createActionItem(...)` validates/normalizes ISO deadlines, enforces non-empty description/owner, defaults status to `"pending"`, and `isActionItemOverdue(item, referenceDate)` reports overdue items relative to an explicit reference date.
- [ ] Vitest unit tests cover all helpers, edge cases, and invalid inputs.

## Security & Compliance

- Pure functions only; no secrets, IO, randomness, or clock access outside of explicit parameters.
- All validation errors should be thrown as `Error` with descriptive messages for auditability.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts` covering:
  - Description/validation helpers for reliability/confidence.
  - Risk score math + full matrix sanity checks.
  - Action item validation, normalization, and overdue detection.
