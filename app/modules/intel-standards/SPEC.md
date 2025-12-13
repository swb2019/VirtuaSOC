# Module: intel-standards

## Goal

Provide reusable intelligence tradecraft primitives (source reliability, confidence,
risk matrix, and action item scaffolding) so downstream modules can compose
mandatory VirtuaSOC product outputs in a consistent, testable way.

## Scope

- In-memory only data structures and helpers.
- Canonical AF-style source reliability scale (A–F) with metadata.
- ICD/ISO-style confidence levels (High/Moderate/Low) with descriptors.
- 5x5 likelihood/impact risk matrix plus derived risk score helper.
- Minimal `ActionItem` shape with owner+deadline validation.
- Unit tests covering the above behaviors.

## Acceptance Criteria

- [ ] Export `SourceReliabilityCode` union ("A"–"F") and
      `SOURCE_RELIABILITY_SCALE` array with label+description per code.
- [ ] Export `ConfidenceLevel` union ("high"/"moderate"/"low") and
      `CONFIDENCE_SCALE` metadata entries.
- [ ] Export `calculateRiskScore(likelihood, impact)` that enforces 1–5 inputs,
      returns `{score: likelihood * impact, band}` using a documented scale.
- [ ] Export `buildRiskMatrix()` that returns a full 5x5 grid of `RiskCell`s with
      monotonically increasing scores across rows/columns.
- [ ] Export `createActionItem({summary, owner, deadline, status?})` that:
      - trims/validates required fields,
      - stores ISO 8601 deadlines, rejecting invalid dates.
- [ ] Tests prove:
      - all reliability/confidence codes are present,
      - risk score/band math works for boundary combinations,
      - risk matrix contains 25 cells with expected coordinates,
      - invalid action item input throws descriptive errors.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure functions only; no IO, persistence, or external integrations.
- Never log or leak potentially sensitive intelligence content.
- All user-provided strings are trimmed; ISO parsing relies on the JS runtime.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
