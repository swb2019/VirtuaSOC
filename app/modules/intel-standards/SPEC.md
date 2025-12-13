# Module: intel-standards

## Goal

Encode the core intelligence standards primitives (source reliability, analytic confidence, 5x5 risk matrices, and action items) as pure, reusable TypeScript utilities for VirtuaSOC.

## Scope

- Define canonical enumerations for Source Reliability (A–F) and Confidence (High/Moderate/Low).
- Provide resolvers that return structured metadata for each enum entry.
- Model the 5x5 Likelihood × Impact risk matrix, expose a helper to derive a risk score + qualitative bucket, and generate the full matrix.
- Define an `ActionItem` primitive (description + owner + ISO deadline + status) with constructor validation.
- Stay in-memory/pure; no IO, storage, or network.

## Acceptance Criteria

- [ ] `getSourceReliability(code)` returns metadata for codes `A`–`F` and throws for invalid input.
- [ ] `getConfidenceLevel(level)` returns metadata for `high`, `moderate`, `low`.
- [ ] `calculateRiskScore(likelihood, impact)` enforces 1–5 bounds, returns the numeric score (`likelihood * impact`) and qualitative banding (`low`, `moderate`, `high`, `critical`).
- [ ] `buildRiskMatrix()` returns a 5×5 array ordered by likelihood (1→5), each cell coming from `calculateRiskScore`.
- [ ] `createActionItem(input)` validates non-empty `action`/`owner` strings, parses ISO-8601 `deadline`, and normalizes `status` (default `"pending"`).
- [ ] Vitest unit tests cover the happy path + invalid inputs for every helper.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, env access, or IO.
- Accept only caller-provided data; validation errors surface via thrown `Error`s.
- All dates are ISO strings to ensure auditability.

## Test Plan

- Vitest tests under `app/modules/intel-standards/tests/intel-standards.test.ts` covering the acceptance criteria.
