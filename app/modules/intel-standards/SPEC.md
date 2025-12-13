# Module: intel-standards

## Goal

Capture core intelligence standards primitives (source reliability, confidence, risk matrix, and action items) as pure, reusable TypeScript utilities.

## Scope

- Provide enumerations and helper functions for the Allied intelligence reliability scale (A–F) and analytic confidence levels (High/Moderate/Low).
- Provide a canonical 5x5 risk matrix where likelihood (1–5) and impact (1–5) yield a deterministic risk score and qualitative band.
- Provide a simple `ActionItem` helper that enforces owner and deadline metadata in ISO8601 format.
- Stay in-memory only; no persistence, IO, or framework dependencies.

## Acceptance Criteria

- [ ] Export `SourceReliabilityCode` (`"A"`–`"F"`), `SourceReliability` metadata (label, description), and helper `getSourceReliability(code)` that throws for invalid codes.
- [ ] Export `ConfidenceLevel` (`"high" | "moderate" | "low"`) and `getConfidence(level)` returning descriptive metadata.
- [ ] Export `LikelihoodLevel` and `ImpactLevel` (1–5) plus `RiskScore` containing `{ likelihood, impact, value, band }`.
- [ ] Implement `calculateRiskScore(likelihood, impact)` that validates inputs, multiplies likelihood × impact, and assigns a qualitative `RiskBand` (`low`, `moderate`, `high`, `critical`).
- [ ] Implement `buildRiskMatrix()` that returns a 5x5 matrix (array of rows) of `RiskScore` objects ordered by likelihood and impact.
- [ ] Export `ActionItem` interface and `createActionItem({ summary, owner, deadline })` that trims inputs, enforces non-empty `summary`/`owner`, validates ISO 8601 deadlines, and returns a normalized object.
- [ ] Unit tests cover:
  - All six source reliability codes and error handling for invalid codes.
  - All three confidence levels.
  - Representative risk score computations across each band and the 5x5 matrix shape.
  - `createActionItem` happy path and invalid inputs (empty owner/summary, malformed deadline).
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure functions only; no secrets, networking, or logging of sensitive content.
- Validation errors must not expose stack traces beyond standard `Error` messages.

## Test Plan

- Vitest suite at `app/modules/intel-standards/tests/intel-standards.test.ts` covering the acceptance criteria above.
