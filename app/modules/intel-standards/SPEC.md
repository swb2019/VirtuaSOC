# Module: intel-standards

## Goal

Provide canonical intelligence tradecraft primitives (source reliability, confidence, risk matrix, and action item definitions) that are re-usable across VirtuaSOC product generators and renderers.

## Scope

- Pure domain module. No IO, networking, or persistence.
- Export typed representations for:
  - Source reliability scale (A–F) with descriptive metadata.
  - Confidence levels (High/Moderate/Low) with metadata.
  - Risk evaluation utilities for a 5x5 matrix (likelihood 1–5, impact 1–5) plus derived risk scores/categories.
  - Action items that capture owner/deadline/description in ISO 8601 format.
- Provide helper functions so downstream modules can materialize the canonical catalog without duplicating logic.

## Acceptance Criteria

- [ ] `getSourceReliability(code)` returns metadata for codes `A` through `F` and throws for invalid codes.
- [ ] `getConfidence(level)` returns metadata for `high`, `moderate`, `low` and throws for invalid levels.
- [ ] `calculateRiskScore(likelihood, impact)` multiplies the two validated integers (1–5).
- [ ] `categorizeRisk(score)` maps scores into standard ISO-31000 style buckets.
- [ ] `createRiskMatrix()` returns a 5x5 matrix (likelihood rows x impact columns) with pre-computed scores/categories.
- [ ] `createActionItem(input)` trims fields, validates ISO deadline, and returns an immutable object.
- [ ] Dedicated Vitest coverage exercises sunny-day paths and validation errors for each function.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or external data sources.
- Only operate on provided primitives; validation errors must not leak sensitive context (just input summary).

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts` validating:
  - Happy path value catalogs for reliability/confidence.
  - Risk matrix dimensions, score math, and category mapping.
  - Action item creation and validation failures (bad code/level/deadline).
