#
Module: intel-standards

## Goal

Provide reusable primitives for intelligence production standards covering source
reliability, analytic confidence, risk quantification, and action tracking.

## Scope

- Define the AF source reliability scale (A-F) with human-readable metadata.
- Define ICD/OSAC-style confidence levels (High/Moderate/Low).
- Provide a canonical 5x5 risk matrix plus helpers to compute derived risk
  scores (likelihood x impact, both 1-5) and severity bands.
- Provide a typed ActionItem structure (owner + deadline required) and a helper
  that enforces ISO 8601 deadlines + default status.
- No external IO, persistence, or date libraries — pure functions only.

## Acceptance Criteria

- [ ] Export `SOURCE_RELIABILITY_SCALE` covering codes A-F, each with label +
      description derived from AF standard text.
- [ ] Export `CONFIDENCE_LEVELS` containing `high | moderate | low`.
- [ ] Export `calculateRiskScore(likelihood, impact)` that:
      - Accepts integers 1-5 only (throws otherwise).
      - Returns `{ likelihood, impact, score, band }` where `score` is the
        product and `band` thresholds are: 1-4 low, 5-9 moderate, 10-16 high,
        17-25 critical.
- [ ] Export `RISK_MATRIX` as a 5x5 readonly grid built from
      `calculateRiskScore`, indexable by `[likelihood-1][impact-1]`.
- [ ] Export `createActionItem({ label, owner, deadline, status? })` returning a
      normalized object with ISO 8601 deadline and default status `pending`.
- [ ] Unit tests cover:
      - Reliability and confidence enumerations.
      - Risk score thresholds (including invalid inputs).
      - Matrix shape integrity.
      - Action item creation + invalid deadline rejection.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or side effects; all helpers are deterministic.
- Validate + normalize deadline input before returning ActionItem.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
