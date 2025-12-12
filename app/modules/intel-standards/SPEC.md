# Module: intel-standards

## Goal

Provide strongly typed primitives for intelligence standards so every
VirtuaSOC component can reason about source reliability, analytic
confidence, and risk scoring in a uniform way.

## Scope

- Pure TypeScript utilities (no IO, storage, or network calls).
- Reference implementations for:
  - AF source reliability scale (A–F).
  - Confidence levels (High/Moderate/Low).
  - 5x5 risk matrix with derived risk score + label.
  - Action item helper with owner + deadline validation.
- Vitest coverage proving the invariants above.

## Acceptance Criteria

- [ ] `sourceReliabilityScale` exposes grades `A`–`F` with canonical
      descriptions and preserves order.
- [ ] `confidenceScale` exposes `high | moderate | low` levels with
      descriptions.
- [ ] `calculateRiskScore(likelihood, impact)`:
  - Accepts only 1–5 integer values.
  - Returns `{likelihood, impact, score, category}` where
    `score = likelihood * impact`.
  - Applies category thresholds: 1–5 low, 6–12 moderate, 13–19 high,
    20–25 critical.
- [ ] `riskMatrix` is a 5x5 grid whose cells equal
      `calculateRiskScore(rowLikelihood, columnImpact)`.
- [ ] `createActionItem` trims owner/description, normalizes deadlines to
      ISO 8601, and rejects blank/invalid inputs.
- [ ] `isActionItemDueSoon(item, days, referenceDate?)` reports whether
      an action item deadline is within the requested window.
- [ ] Vitest spec in `app/modules/intel-standards/tests/intel-standards.test.ts`
      covers the behaviors above.

## Security & Compliance

- In-memory only; no secrets, logging, or integration calls.
- Deterministic behavior given explicit inputs (time dependency only
  when `referenceDate` is omitted).

## Test Plan

- Vitest file `app/modules/intel-standards/tests/intel-standards.test.ts`
  exercises:
  - Scale coverage (grades/levels/descriptions).
  - Risk score math and matrix integrity.
  - Action item creation validation and date handling.
  - `isActionItemDueSoon` boundary behavior with provided reference
    dates to avoid flakiness.
