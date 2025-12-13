# Module: intel-standards

## Goal

Provide canonical intelligence-analysis primitives so other modules can reason
about source reliability, analytic confidence, and risk in a consistent way.

## Scope

- Define Source Reliability (A–F) and Confidence (High/Moderate/Low) enums with
  helpers to reason about them.
- Provide a 5x5 risk matrix generator and a deterministic `RiskScore` helper.
- Provide a simple `ActionItem` primitive (owner + deadline) with validation so
  downstream pipelines can schedule follow-on work.
- Pure TypeScript, no IO or environment dependencies.

## Acceptance Criteria

- [ ] `SourceReliability` and `ConfidenceLevel` exported as string unions.
- [ ] `describeSourceReliability(code)` returns the doctrinal description and
      rejects invalid codes.
- [ ] `calculateRiskScore(likelihood, impact)` returns:
  - `likelihood` and `impact` in the range 1–5.
  - `value = likelihood * impact`.
  - `band` derived from the value (`low`, `moderate`, `high`, `critical`).
- [ ] `createRiskMatrix()` returns a 5x5 grid (likelihood rows, impact columns)
      of `RiskScore` objects and can be used to look up any cell.
- [ ] `createActionItem({ action, owner, deadline })` trims input strings,
      normalizes the deadline to ISO-8601, and rejects invalid dates.
- [ ] Unit tests cover reliability descriptions, confidence ordering, risk score
      banding boundaries, matrix dimensions, and action item validation.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, no network, no filesystem.
- All helpers are pure and side-effect free.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
