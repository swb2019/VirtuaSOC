# Module: intel-standards

## Goal

Provide canonical primitives for intelligence standards (source reliability,
confidence, risk scoring, and action tracking) so every pipeline component uses
the same definitions.

## Scope

- Define `SourceReliability` (A-F) with short descriptors.
- Define `ConfidenceLevel` (High/Moderate/Low) and ordering helpers.
- Publish 5x5 `RiskMatrix` (likelihood 1-5, impact 1-5) plus `RiskScore`
  utility.
- Provide an `ActionItem` primitive (action, owner, deadline) with validation.
- All code is pure TypeScript utilities; no IO, storage, or network access.

## Acceptance Criteria

- [ ] Module exports the reliability scale, confidence order, and helper
      descriptions.
- [ ] Module exports `RISK_MATRIX`, `computeRiskScore`, and `RiskScore`
      semantics (value + qualitative band).
- [ ] `createActionItem` enforces non-empty owner/action and ISO8601 deadlines.
- [ ] Unit tests cover each primitive (reliability descriptors, confidence
      ordering, risk score math, action item validation).
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, tokens, or network access.
- All inputs validated locally; no logging of sensitive content.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`
  covering the acceptance criteria above.

