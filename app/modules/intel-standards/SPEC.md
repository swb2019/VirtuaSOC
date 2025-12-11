# Module: intel-standards

## Goal

Define canonical intelligence tradecraft primitives that every VirtuaSOC product
must reference: source reliability, analytic confidence, risk scoring, and
action tracking.

## Scope

- Provide strongly typed representations of:
  - Source reliability scale (A–F) with human-readable descriptors.
  - Analytic confidence levels (High/Moderate/Low).
  - A 5x5 risk matrix (likelihood 1–5 x impact 1–5) and derived risk score.
  - Action items that always include an owner and deadline.
- Export helper utilities to:
  - Describe each scale entry.
  - Calculate a risk score and rating.
  - Generate a canonical 5x5 matrix for rendering/reporting.
  - Normalize action items while validating deadlines.
- Pure in-memory utilities only (no IO, network, or randomness).

## Acceptance Criteria

- [ ] `describeSourceReliability(code)` returns the descriptor for codes A–F.
- [ ] `describeConfidence(level)` returns descriptors for High/Moderate/Low.
- [ ] `calculateRiskScore(likelihood, impact)` returns the 1–25 score.
- [ ] `createRiskMatrix()` returns a 5x5 matrix whose cells include
  `likelihood`, `impact`, `score`, and a derived rating.
- [ ] `createActionItem(input)` enforces non-empty action/owner strings and a
  valid ISO 8601 deadline (string or Date input) and returns normalized data.
- [ ] Vitest unit tests cover all happy paths plus deadline validation errors.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure functions only; no logging, IO, secrets, or external data sources.
- Validation errors must not leak sensitive context—use generic messages.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`.
