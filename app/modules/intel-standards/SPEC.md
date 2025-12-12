# Module: intel-standards

## Goal

Codify shared intelligence-analysis primitives (source reliability, analytic
confidence, risk matrices, and action tracking) so downstream modules can
produce consistent, standards-compliant outputs.

## Scope

- Provide enumerations + descriptive metadata for:
  - `SourceReliability` (A–F scale).
  - `ConfidenceLevel` (High/Moderate/Low).
- Provide functions to build and operate on a canonical 5x5 risk matrix.
- Provide primitives for action tracking (description, owner, ISO deadline).
- No persistence, network I/O, or framework dependencies.

## Acceptance Criteria

- [ ] Type-safe union for `SourceReliability` with metadata describing each
      score (code, label, description).
- [ ] Type-safe union for `ConfidenceLevel` with metadata describing each
      value.
- [ ] `calculateRiskScore(likelihood, impact)` returns an object containing:
  - likelihood (1–5) + impact (1–5)
  - numeric score (likelihood × impact)
  - qualitative bucket derived from score ranges (1–5 minimal, 6–10 low,
    11–15 moderate, 16–20 high, 21–25 critical)
- [ ] `buildRiskMatrix()` returns a 5×5 matrix (rows likelihood 1–5,
      columns impact 1–5) of risk score objects.
- [ ] `createActionItem(input)` validates required fields, normalizes the ISO
      deadline, and returns an immutable `ActionItem`.
- [ ] Unit tests cover:
  - Enumerations expose all expected metadata entries.
  - Risk score calculations for representative cells (corners, midpoints).
  - Entire matrix shape (5 rows × 5 columns).
  - Action item validation (rejects empty owner/description, accepts trimmed).
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or tenant data.
- All inputs validated, deadlines stored as ISO strings.
- Pure functions only; no side effects for easy deterministic testing.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
