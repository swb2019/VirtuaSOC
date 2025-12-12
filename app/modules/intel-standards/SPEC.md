# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, analytic confidence, risk matrix, and action tracking) that other VirtuaSOC modules can compose without re-implementing the AF/ICD-203 definitions.

## Scope

- Pure TypeScript domain types and helpers only (no IO, no storage, no timers).
- Expose:
  - `SourceReliability` scale (A-F) with descriptors.
  - `ConfidenceLevel` (High/Moderate/Low) with descriptors.
  - 5x5 likelihood/impact risk matrix utilities with derived risk score + qualitative tiering.
  - `ActionItem` model (description, owner, deadline, status) plus helper to normalize deadlines.
- Keep data immutable and serializable so downstream renderers can embed these structures directly.

## Acceptance Criteria

- [ ] `SourceReliability` is a literal union (`"A"`-`"F"`) and the module exports a lookup map describing each level.
- [ ] `ConfidenceLevel` is a literal union (`"high" | "moderate" | "low"`) with descriptors.
- [ ] Likelihood & impact scorings are constrained to 1-5 and `calculateRiskScore(likelihood, impact)` returns:
  - Numeric score (likelihood × impact).
  - Qualitative tier (Very Low / Low / Moderate / High / Critical) derived from score thresholds.
- [ ] `buildRiskMatrix()` returns a 5x5 matrix (25 entries) ordered by likelihood (rows) and impact (columns).
- [ ] `ActionItem` enforces required `action`, `owner`, `deadline`, and optional `status` (default `"pending"`).
- [ ] `createActionItem()` normalizes Date/ISO strings into ISO 8601 UTC strings and rejects invalid inputs.
- [ ] Comprehensive unit tests cover:
  - Reliability/confidence descriptors.
  - Risk scoring & matrix boundaries.
  - Action item normalization + validation failures.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or network calls.
- No mutation of shared state; helpers return new objects so downstream logging/redaction choices stay explicit.
- All inputs validated defensively to prevent invalid risk/action data from entering saved artifacts.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
