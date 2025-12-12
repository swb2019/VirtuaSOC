# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, confidence, risk scoring, and action tracking) that other modules can depend on without duplicating domain logic.

## Scope

- Pure TypeScript data types and helper functions.
- Encode Source Reliability (A-F) and Confidence (High/Moderate/Low) values with lookup helpers for descriptions.
- Represent a 5x5 Risk Matrix (Likelihood 1-5 x Impact 1-5) and compute derived RiskScore metadata.
- Define an ActionItem (description, owner, deadline) constructor with basic validation utilities.
- No IO, persistence, or framework dependencies.

## Acceptance Criteria

- [ ] `SourceReliability` is a discriminated union of "A" through "F" with `describeSourceReliability(code)` returning NATO-style meaning strings.
- [ ] `ConfidenceLevel` is a union of `"high" | "moderate" | "low"` with `describeConfidence(level)` returning text aligned to ICD-203 guidance.
- [ ] Likelihood and Impact scales are integers 1-5 (inclusive) enforced via TypeScript types.
- [ ] `computeRiskScore(likelihood, impact)` returns an object with:
  - Likelihood and impact echoed back.
  - `value` = likelihood * impact.
  - `category` derived from value using thresholds: 1-5 "low", 6-10 "moderate", 11-15 "elevated", 16-20 "high", 21-25 "critical".
- [ ] `buildRiskMatrix()` returns an immutable 5x5 matrix (Likelihood rows asc, Impact columns asc) of `RiskScore` entries.
- [ ] `ActionItem` type captures `description`, `owner`, and ISO-8601 `deadline` strings.
- [ ] `createActionItem(input)` trims fields, validates non-empty `description` + `owner`, and ensures `deadline` parses to a valid date (throws otherwise).
- [ ] Vitest unit tests cover success and failure paths for helpers, and `pnpm test` passes.

## Security & Compliance

- Pure functions only; no secrets, logging, randomness, or external IO.
- Validation errors must be descriptive without leaking sensitive data.

## Test Plan

- Unit tests live in `app/modules/intel-standards/tests/intel-standards.test.ts` and exercise:
  - Description helpers for reliability and confidence.
  - Risk score computation and full matrix generation.
  - Happy and error paths for `createActionItem`.
