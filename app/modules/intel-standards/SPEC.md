# Module: intel-standards

## Goal

Codify the intelligence tradecraft primitives (source reliability, analytic
confidence, and risk scoring) that every VirtuaSOC product must emit. The
module provides typed data plus helper utilities so downstream features can use
the same canonical definitions.

## Scope

- In-memory data structures only (no IO or persistence).
- Enumerate the AF source reliability grades (A–F) with narratives.
- Enumerate the confidence levels (High/Moderate/Low) with narratives.
- Provide a deterministic 5x5 risk matrix (likelihood x impact) and a helper to
  derive the numeric score + qualitative category.
- Define an `ActionItem` primitive that always includes an owner and deadline.

## Acceptance Criteria

- [ ] `getSourceReliability(grade)` returns the AF meaning for grades A–F.
- [ ] `getConfidenceDescriptor(level)` returns the analytic confidence meaning
      for levels High/Moderate/Low.
- [ ] `deriveRiskScore(likelihood, impact)` returns:
  - likelihood + impact (1–5),
  - numeric score (1–25),
  - qualitative category per thresholds
    (`low`, `moderate`, `high`, `critical`).
- [ ] `RISK_MATRIX` exposes the canonical 5x5 table built from
      `deriveRiskScore`.
- [ ] `createActionItem(input)` normalizes/validates deadlines (ISO 8601) and
      returns an `ActionItem` with owner + deadline.
- [ ] Vitest unit tests cover the scales, risk scoring, matrix integrity, and
      action item helper. `pnpm test` passes.

## Security & Compliance

- Pure functions only; no secrets, logging, or network access.
- Validation errors throw synchronous exceptions—callers must handle them.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`.
