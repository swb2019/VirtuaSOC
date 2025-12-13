# Module: intel-standards

## Goal

Codify intelligence tradecraft primitives (source reliability, analytic
confidence, risk matrices, and action tracking) as reusable, type-safe
utilities for VirtuaSOC modules.

## Scope

- Enumerations for the AF source reliability scale (A-F) with helper metadata.
- Confidence levels (High/Moderate/Low) as typed constants.
- A deterministic 5x5 risk matrix builder that calculates likelihood × impact
  scores (1-25) and maps them to qualitative ratings.
- Action item primitives that guarantee an owner and ISO 8601 deadline.
- Pure functions only; no persistence or network behavior.

## Acceptance Criteria

- [ ] `SourceReliability` and `ConfidenceLevel` unions are exported along with
      descriptor maps for human-readable definitions.
- [ ] `calculateRiskScore(likelihood, impact)` validates both values (1-5),
      returns the raw score and qualitative rating, and is used by
      `buildRiskMatrix()`.
- [ ] `buildRiskMatrix()` returns 5 rows × 5 columns ordered by likelihood then
      impact, with strictly increasing scores along each dimension.
- [ ] `createActionItem({ summary, owner, deadline })` enforces non-empty owner
      and ISO 8601 deadlines and returns an immutable snapshot that can be
      serialized.
- [ ] Vitest coverage lives in `app/modules/intel-standards/tests` and exercises
      all paths above (`pnpm test` passes).

## Security & Compliance

- No secrets, timers, logging, or IO in this module.
- Inputs are validated defensively; invalid data results in thrown errors.
- Safe for reuse across tenants (pure data transformations only).

## Test Plan

- Unit tests using Vitest in
  `app/modules/intel-standards/tests/intel-standards.test.ts` covering:
  - Scale descriptors are exhaustive.
  - Risk matrix dimensions, monotonicity, and qualitative buckets.
  - Action item validation for deadlines and owner requirements.
