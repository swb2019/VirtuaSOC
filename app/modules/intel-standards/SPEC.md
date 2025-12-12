# Module: intel-standards

## Goal

Provide canonical intelligence-tradecraft primitives (source reliability, analytic
confidence, risk matrix, and action plans) as pure, reusable utilities.

## Scope

- Type-safe enumerations + helpers for Source Reliability (A–F) and Confidence
  (High/Moderate/Low).
- Risk matrix utilities that produce a 5x5 likelihood/impact grid with derived
  risk scores + qualitative rating.
- Action item structure with owner + deadline metadata and lightweight helpers.
- Pure, in-memory logic only. No IO, network, persistence, or logging.

## Acceptance Criteria

- [ ] Export `SourceReliability` union (`"A"` … `"F"`) + descriptions helper that
      covers every scale entry.
- [ ] Export `ConfidenceLevel` union (`"high" | "moderate" | "low"`) +
      descriptions helper.
- [ ] Provide `generateRiskMatrix()` that returns a 5x5 matrix covering every
      likelihood/impact combination (1–5) with derived `score` and rating based
      on the product.
- [ ] Provide `evaluateRisk(likelihood, impact)` → `RiskScore` with fields for
      likelihood, impact, score (product), and rating thresholds:
      - score ≤ 5 → `low`
      - 6–12 → `moderate`
      - 13–20 → `high`
      - ≥ 21 → `critical`
- [ ] Export `ActionItem` type with at least `description`, `owner`, `deadline`,
      `status`, and helpers `createActionItem` + `isActionItemOverdue`.
- [ ] Unit tests cover:
      - every source reliability + confidence description;
      - matrix dimensions/values;
      - risk evaluation thresholds;
      - action item creation + overdue detection.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure functions; no secrets or external integrations.
- All deadlines use ISO 8601 strings; validation errors throw descriptive
  messages.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
