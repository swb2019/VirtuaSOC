# Module: intel-standards

## Goal

Encode the core intelligence tradecraft primitives (source reliability, analytic confidence, and risk scoring) that every VirtuaSOC product must reference.

## Scope

- Immutable domain data for:
  - AF source reliability grading (A-F with human-readable definitions).
  - Confidence levels (High/Moderate/Low) with descriptions.
- Deterministic helpers to reason about 5x5 risk matrices (Likelihood 1-5, Impact 1-5):
  - Score calculation (Likelihood * Impact).
  - Severity classification bands aligned to ISO-31000-style terminology.
  - Matrix builder that enumerates all 25 cells.
- Action item representation with enforced owner and deadline metadata and simple helper for creation/validation.
- Pure functions only (no IO, timers, logging).

## Acceptance Criteria

- [ ] `SourceReliabilityGrade` enum-like union for A-F plus static lookup table `SOURCE_RELIABILITY_SCALE` with short description per grade and helper `getSourceReliability(grade)`.
- [ ] `ConfidenceLevel` union (`"high" | "moderate" | "low"`) plus lookup table with descriptors and helper `getConfidenceLevel(level)`.
- [ ] `calculateRiskScore(likelihood, impact)` returns object with likelihood, impact, score (1-25), and severity bucket according to thresholds (1-5 minimal, 6-10 low, 11-15 moderate, 16-20 high, 21-25 critical).
- [ ] `buildRiskMatrix()` returns a 5x5 (likelihood-major) matrix of risk cells covering every possible input pair (25 entries) without duplicates.
- [ ] `ActionItem` interface captures `description`, `owner`, `deadline` (ISO 8601) and optional `status`. Helper `createActionItem()` validates non-empty owner/deadline and normalizes deadline to ISO string.
- [ ] Comprehensive unit tests cover:
  - Lookup helpers returning correct descriptions.
  - Risk score calculations & severity boundaries.
  - Matrix builder producing 25 unique cells.
  - Action item helper enforcing deadline formatting.
- [ ] `pnpm test` passes.

## Security & Compliance

- Static data only; no secrets, IO, or environment access.
- Validation errors must be deterministic `Error` instances with descriptive messages.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts` covering all acceptance criteria.
