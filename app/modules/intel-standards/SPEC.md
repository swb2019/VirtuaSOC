# Module: intel-standards

## Goal

Provide canonical intelligence-analysis primitives (scales, risk scoring, and task tracking) that every product can share without duplicating logic.

## Scope

- Source Reliability scale (A–F) with textual descriptors.
- Confidence level scale (High/Moderate/Low) plus an ordering helper.
- Risk scoring helpers for a 5x5 likelihood/impact matrix, including:
  - Likelihood + Impact ordinal types (1–5).
  - RiskScore calculation (likelihood × impact) and qualitative bucket.
  - Generation of a full 5×5 matrix of RiskScore cells for downstream renderers.
- ActionItem primitive that captures owner + deadline + description, with helpers to normalize inputs and detect overdue work.
- Pure TypeScript implementation; no IO or persistence.

## Acceptance Criteria

- [ ] `SourceReliability` union type exposes `"A"` through `"F"` with descriptors exported via `SOURCE_RELIABILITY_SCALE`.
- [ ] `describeSourceReliability(code)` returns the descriptor object for valid codes.
- [ ] `ConfidenceLevel` union type represents `"low" | "moderate" | "high"` and `compareConfidence(a, b)` returns -1/0/1 using that order.
- [ ] `calculateRiskScore(likelihood, impact)` returns `{ likelihood, impact, value, level }` where:
  - `likelihood` and `impact` are constrained to `[1, 5]`.
  - `value = likelihood * impact`.
  - `level` buckets: `<=5` low, `6-12` moderate, `13-19` high, `>=20` critical.
- [ ] `buildRiskMatrix()` returns the 5 × 5 grid of `RiskScore` values ordered by likelihood asc, impact asc.
- [ ] `createActionItem({ description, owner, deadline, status? })` trims strings, validates ISO 8601 deadline, and defaults status to `"pending"`.
- [ ] `isActionItemOverdue(item, refDate?)` returns true when deadline is before `refDate` (defaults to now) and status is not `"completed"`.
- [ ] Vitest unit coverage under `app/modules/intel-standards/tests/intel-standards.test.ts`.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, env vars, IO, or randomness.
- All inputs validated and normalized; deadline parsing uses built-in `Date`.
- Pure functions to maximize determinism for downstream auditing.

## Test Plan

- Vitest suite covering:
  - Descriptor lookups for source reliability.
  - Confidence ordering comparisons.
  - RiskScore boundaries + matrix dimensions.
  - Action item normalization and overdue detection.
