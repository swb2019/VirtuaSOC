# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, confidence, risk, and action tracking) that the rest of the VirtuaSOC pipeline can reuse without re-implementing domain-specific logic.

## Scope

- Pure in-memory TypeScript types and helpers.
- Encode the AF reliability scale (A-F) with human-readable descriptions.
- Encode the High/Moderate/Low confidence scale with descriptions.
- Represent a 5x5 likelihood/impact risk matrix and expose utilities to derive a numeric score and qualitative band.
- Provide an `ActionItem` structure (description, owner, deadline, status) plus a helper to validate/create entries.

## Acceptance Criteria

- [ ] `SourceReliability` union type exposes values `"A"` through `"F"` and `describeSourceReliability` returns AF-standard text for each value.
- [ ] `ConfidenceLevel` union type exposes values `"high" | "moderate" | "low"` and `describeConfidence` returns descriptive text for each value.
- [ ] Likelihood/Impact values are constrained to the inclusive range 1-5; `calculateRiskScore` returns `{ likelihood, impact, score, band }` where `score = likelihood * impact` and `band` is derived using thresholds (<=5 low, 6-12 moderate, 13-19 high, 20-25 critical).
- [ ] `RISK_MATRIX` constant enumerates every possible likelihood/impact pairing (25 cells) as immutable data.
- [ ] `ActionItem` type captures `description`, `owner`, `deadline` (ISO 8601), and `status` (`pending | in_progress | complete`). Helper `createActionItem` trims inputs, validates owner/deadline are non-empty and deadline is ISO 8601, and returns a normalized object.
- [ ] Vitest unit tests cover the helpers, boundary risk values, and invalid action item inputs.
- [ ] `pnpm test` passes.

## Security & Compliance

- No network, filesystem, or logging side effects.
- All helpers are pure; validation errors throw plain `Error` instances without leaking sensitive data.

## Test Plan

- Vitest cases under `app/modules/intel-standards/tests/intel-standards.test.ts`.
