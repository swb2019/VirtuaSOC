# Module: intel-standards

## Goal

Provide shared intelligence standards primitives so every product can express
source reliability, confidence, risk, and actionable follow-ups consistently.

## Scope

- Source reliability scale (A–F) with canonical descriptions.
- Analytical confidence levels (High / Moderate / Low).
- 5x5 risk matrix utilities (likelihood 1–5 x impact 1–5) and derived risk score
  + severity category.
- Action item helper that captures owner, description, and ISO 8601 deadline.
- Pure TypeScript types and helper functions. No IO, storage, or network calls.

## Acceptance Criteria

- [ ] Export typed constants for the source reliability scale and confidence
      levels so downstream modules cannot drift from ICD-203/OSAC wording.
- [ ] Provide helpers:
      - `describeSourceReliability(code)` returns the canonical description.
      - `calculateRiskScore(likelihood, impact)` returns a 1–25 score.
      - `riskCategoryFromScore(score)` maps to Low/Moderate/High/Critical.
      - `generateRiskMatrix()` returns the full 5x5 grid of cells including
        likelihood, impact, score, and category for every combination.
      - `createActionItem({ description, owner, deadline })` trims strings,
        validates required fields, enforces ISO 8601 deadlines, and returns a
        normalized object.
- [ ] Unit tests cover reliability lookups, risk score/category thresholds, risk
      matrix generation (25 cells), and action item validation (success + error
      paths).
- [ ] `pnpm test` passes.

## Security & Compliance

- Deterministic, pure functions only.
- No secrets, API calls, or logging of sensitive content.
- Validation errors are thrown synchronously with descriptive messages.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
