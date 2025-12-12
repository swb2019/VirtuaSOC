# Module: intel-standards

## Goal

Codify core intelligence tradecraft primitives (source reliability, confidence, risk matrices, and prescribed action items) so that downstream modules can reason about product requirements consistently.

## Scope

- Provide canonical type definitions for:
  - Source reliability scale (codes A-F) with AF-style descriptions.
  - Analytic confidence levels (High/Moderate/Low).
  - 5x5 likelihood/impact risk grid and derived numeric scores.
  - Action items that always capture an owner and an ISO 8601 deadline.
- Provide helpers to construct/validate each primitive so invalid inputs are rejected early.
- Keep the module fully in-memory and deterministic.

## Acceptance Criteria

- [ ] `SourceReliabilityCode` is the union `"A" | "B" | "C" | "D" | "E" | "F"`.
- [ ] `getSourceReliability(code)` returns an object with the code and canonical description or throws for invalid codes.
- [ ] `ConfidenceLevel` is the union `"high" | "moderate" | "low"`, with helper `assertConfidenceLevel(value)` that narrows unknown strings.
- [ ] Likelihood and impact levels are strict integers 1-5.
- [ ] `calculateRiskScore(likelihood, impact)` returns `{ likelihood, impact, score, band }` where `band` is one of `"low" | "moderate" | "high" | "critical"` according to the score buckets (≤5, 6-12, 13-17, ≥18).
- [ ] `generateRiskMatrix()` returns a 5x5 matrix (array of rows) covering all combinations of likelihood/impact and exposing the derived score & band for each.
- [ ] `createActionItem({ description, owner, deadline })` ensures non-empty text, validates ISO 8601 deadline strings, and normalizes the payload.
- [ ] Vitest unit tests cover happy-paths and invalid inputs for every helper and confirm the matrix contains 25 cells with the expected extrema values.
- [ ] `pnpm test` passes.

## Security & Compliance

- No IO, networking, or randomness.
- No secrets or environment access.
- Validation errors should not leak sensitive context; throw standard `Error`/`TypeError` messages only.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts` that:
  - Checks lookup helpers for valid/invalid inputs.
  - Asserts risk scoring buckets and matrix coverage.
  - Ensures `createActionItem` rejects invalid descriptions/owners/deadlines and preserves valid data.
