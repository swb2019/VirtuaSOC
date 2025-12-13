# Module: intel-standards

## Goal

Provide reusable primitives for intelligence standards that every generated product must reference (source reliability, confidence, risk, action item metadata).

## Scope

- Pure data structures + helper functions only.
- No external IO, persistence, or side effects.
- Consumers rely on these primitives to compose product schemas and renderers.

## Acceptance Criteria

- [ ] `SourceReliability` scale with ratings **A-F**, each with label + description, and helper `describeSourceReliability(rating)`.
- [ ] `ConfidenceLevel` enum (`high | moderate | low`) with helper `describeConfidence(level)` that returns rationale text.
- [ ] `RiskMatrixCell` type modelling likelihood (1-5) and impact (1-5) plus helpers:
  - `createRiskMatrixCell({ likelihood, impact })` validates range and returns immutable object.
  - `calculateRiskScore(cell)` returns Likelihood × Impact.
  - `deriveRiskLevel(score)` maps score to `low | moderate | high | critical`.
- [ ] `ActionItem` type with `title`, `owner`, `deadline` (ISO 8601), optional `status`, created via `createActionItem({ title, owner, deadline, status? })` that validates deadline format.
- [ ] Vitest unit tests prove the helpers behave as described (edge cases for invalid ranges/dates included).
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, credentials, or network usage.
- All helpers must be deterministic/pure to preserve auditability.

## Test Plan

- Vitest spec in `app/modules/intel-standards/tests/intel-standards.test.ts` covering:
  - Reliability + confidence descriptors.
  - Risk matrix cell validation + scoring + level derivation.
  - Action item creation and ISO deadline enforcement.
