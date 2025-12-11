# Module: intel-standards

## Goal

Provide strongly-typed primitives for intelligence tradecraft standards so downstream modules can consistently represent source reliability, confidence, risk matrices, and action items.

## Scope

- Pure in-memory types and helpers only.
- No IO, network, randomness, or time access.
- Cover:
  - Source reliability scale (A–F).
  - Confidence levels (High/Moderate/Low).
  - 5x5 risk matrix helpers with derived risk score.
  - Action item representation (owner, deadline, description, status).

## Acceptance Criteria

- [ ] Export literal types for `SourceReliability` (A–F) and `ConfidenceLevel` (High/Moderate/Low) plus runtime guards/coercion helpers.
- [ ] Provide `LikelihoodLevel` and `ImpactLevel` constrained to 1–5 with helpers that validate inputs.
- [ ] Implement `calculateRiskScore(likelihood, impact)` that returns likelihood × impact (1–25) and throws for invalid inputs.
- [ ] Implement `createRiskMatrixCell(likelihood, impact)` returning a cell with likelihood, impact, and derived score.
- [ ] Implement `buildRiskMatrix()` returning a 5×5 matrix (nested arrays) of `RiskMatrixCell`s ordered by likelihood then impact.
- [ ] Define `ActionItem` interface with `description`, `owner`, `deadline` (ISO 8601), and `status` (`pending | in_progress | done`).
- [ ] Implement `createActionItem(input)` that trims/validates owner & description, ensures ISO deadline, and defaults status to `pending`.
- [ ] Vitest coverage exercises happy-path + failure cases for all helpers.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure calculations only; no secrets or logging.
- All validation errors must be deterministic and not reveal sensitive data.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts` verifying:
  - Runtime guards accept valid values and reject invalid ones.
  - Risk score computations and matrix shape.
  - Action item creation/validation behavior.
