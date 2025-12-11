# Module: intel-standards

## Goal

Capture the canonical intelligence standards primitives (source reliability, analytic confidence, risk matrix, and action items) that every VirtuaSOC product must emit.

## Scope

- Pure, data-only utilities: no IO, logging, or network calls.
- Provide types + helpers for:
  - Source reliability scale (A–F) with textual definitions.
  - Confidence levels (High/Moderate/Low) with helper comparison.
  - A 5x5 risk matrix that derives a risk score from likelihood × impact.
  - Action items with enforced owner + ISO deadline metadata.
- Keep implementation framework-agnostic so the primitives can be shared across modules.

## Acceptance Criteria

- [ ] `SourceReliability` union type includes only `"A"`–`"F"` plus helpers:
  - `SOURCE_RELIABILITY_LEVELS` exposes the allowed values in canonical order.
  - `describeSourceReliability(level)` returns the AF standard description.
- [ ] `ConfidenceLevel` union (`"high" | "moderate" | "low"`) plus:
  - `CONFIDENCE_ORDER` exported array for ordering comparisons.
  - `compareConfidence(a, b)` returns `1`, `0`, `-1` for ordering decisions.
- [ ] `RiskMatrix` builder produces a 5x5 grid (likelihood 1-5 × impact 1-5) where each cell contains a derived `RiskScore`:
  - Inputs outside 1-5 throw.
  - `calculateRiskScore(likelihood, impact)` returns `{ value, band }` with deterministic band thresholds (1-5 minimal, 6-10 low, 11-15 moderate, 16-20 high, 21-25 critical).
- [ ] `ActionItem` interface enforces `{ description, owner, deadline, completed }` with deadline stored as ISO 8601 string.
  - `createActionItem(...)` normalizes/validates inputs.
  - `isActionItemOverdue(action, referenceDate?)` returns boolean.
- [ ] Tests cover happy paths + validation failures for each primitive and live under `app/modules/intel-standards/tests`.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or identifiers leave this module.
- Inputs validated defensively; throw on invalid values to avoid propagating corrupt risk data.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
