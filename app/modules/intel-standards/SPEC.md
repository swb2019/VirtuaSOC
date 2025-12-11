# Module: intel-standards

## Goal

Provide strongly-typed primitives for intelligence standards that VirtuaSOC must satisfy (source reliability, confidence levels, 5x5 risk matrix, and action tracking) so downstream modules can rely on consistent semantics.

## Scope

- Pure domain logic only (no IO, storage, network, or randomness).
- Export canonical enumerations/mappings for AF source reliability (A-F) and confidence levels (High/Moderate/Low).
- Offer helpers to build/validate 5x5 likelihood/impact matrices with derived risk scores + categorical buckets.
- Provide an `ActionItem` shape (owner + deadline) with helpers to enforce ISO dates and detect overdue items.

## Acceptance Criteria

- [ ] `SourceReliability` union (`"A"`-`"F"`) plus `SOURCE_RELIABILITY_SCALE` descriptions matching AF guidance.
- [ ] `ConfidenceLevel` union (`"high" | "moderate" | "low"`) plus ordinal metadata (`CONFIDENCE_SCALE`).
- [ ] `computeRiskScore(likelihood, impact)` validates 1-5 integers and returns `{ likelihood, impact, riskScore, bucket }` where `riskScore = likelihood * impact`.
- [ ] `buildRiskMatrix()` returns all 25 combinations sorted by descending risk score and reuses `computeRiskScore`.
- [ ] `ActionItem` type exposes `owner`, `description`, `deadline`, `completed` and `createActionItem` enforces non-empty owner/description + ISO deadline.
- [ ] `isActionItemOverdue(item, referenceDate?)` returns true when deadline is before the reference instant and the item is not completed.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts` proves the above behaviors.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, external calls, or tenant data access.
- All functions are deterministic and side-effect free for auditability.
- Dates are handled strictly as ISO 8601 strings; no locale-specific parsing.

## Test Plan

- Add unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts` exercising enumerations, risk computations, and action item helpers.
