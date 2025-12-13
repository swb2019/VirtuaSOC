# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives that encode source reliability, analytic confidence, 5x5 risk calculations, and follow-up action items so other modules can reason about intelligence products consistently.

## Scope

- Pure TypeScript implementations of AF-style source reliability (A-F) and confidence (High/Moderate/Low) scales.
- Risk matrix helpers for the mandatory 5x5 likelihood/impact grid plus derived risk score + rating classification.
- Lightweight action-item representation (owner, action, deadline, status) with helpers to normalize ISO timestamps and detect overdue tasks.
- No persistence, networking, or external dependencies.

## Acceptance Criteria

- [ ] Export `SourceReliabilityCode` ("A"–"F") plus metadata describing each code and a type guard (`isSourceReliabilityCode`).
- [ ] Export `describeSourceReliability(code)` that returns the canonical label/description for the code; throws on invalid input.
- [ ] Export `ConfidenceLevel` ("high"/"moderate"/"low") plus `compareConfidence(a,b)` that orders levels high > moderate > low and helper metadata via `describeConfidence(level)`.
- [ ] Provide `calculateRiskScore(likelihood, impact)` for 1–5 inputs, `classifyRisk(score)` that maps to low/moderate/high/extreme bands, and `buildRiskMatrix()` that returns a 5x5 matrix of cells with likelihood, impact, score, and rating.
- [ ] Define `ActionItem` containing `id`, `owner`, `action`, `deadline`, and `status` ("pending"|"completed") plus helpers `createActionItem`, `completeActionItem`, and `isActionItemOverdue` that validate/normalize inputs.
- [ ] Vitest unit tests cover each primitive and ensure invalid inputs throw with helpful messages.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, IO, or persistence; everything is in-memory and deterministic.
- Reject invalid inputs early to avoid propagating bad intelligence metadata.
- All timestamps normalized to ISO 8601 to aid auditability.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
