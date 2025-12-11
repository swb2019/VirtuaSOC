# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, analytic confidence, risk scoring, and action tracking) so downstream modules can assemble mandated product elements consistently.

## Scope

- Pure TypeScript logic, no IO.
- Export literal types and helper functions for:
  - Source reliability A-F scale (with textual definitions).
  - Confidence levels (High/Moderate/Low) derived from numeric evidence strength.
  - Five-by-five risk matrix utilities (likelihood 1-5 x impact 1-5) with derived risk score bands.
  - Action item model (owner + deadline + description + status helpers).

## Acceptance Criteria

- [ ] `SourceReliability` type must cover `"A"` through `"F"` with `describeSourceReliability()` returning canonical definitions.
- [ ] `ConfidenceLevel` type must cover `"high" | "moderate" | "low"` with `confidenceFromProbability()` mapping `[0,1]` inputs to a level.
- [ ] `computeRiskScore(likelihood, impact)` returns `{ likelihood, impact, value, band }` where `value = likelihood * impact` and `band` buckets follow ISO-31000 style thresholds (<=4 Low, 5-9 Moderate, 10-16 High, 17-25 Critical).
- [ ] `createRiskMatrix()` produces all 25 combinations with stable ordering (likelihood ascending, impact ascending per row) and allows lookups via `getCell(likelihood, impact)`.
- [ ] `ActionItem` captures `description`, `owner`, `deadline`, `status`; `createActionItem()` validates ISO 8601 deadlines and defaults status to `"pending"`; `isActionItemOverdue()` reports overdue items.
- [ ] Vitest unit tests cover:
  - Reliability descriptions and invalid inputs.
  - Confidence mapping edge cases.
  - Risk score thresholds and matrix generation (size + lookup).
  - Action item creation, ISO coercion, and overdue detection.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or network calls.
- All helpers are deterministic and side-effect free.
- Date handling must rely on `Date` built-ins only (no external libs).

## Test Plan

- Vitest suite at `app/modules/intel-standards/tests/intel-standards.test.ts` covering acceptance criteria.
