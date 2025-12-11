# Module: intel-standards

## Goal

Codify the core intelligence standards primitives (source reliability, confidence, risk matrices, and action items) so other modules can consistently reference and validate them.

## Scope

- Provide canonical enumerations for source reliability (A–F) and confidence (high/moderate/low).
- Offer helper utilities that describe and validate the enumerations.
- Represent 5x5 risk matrices (likelihood 1-5 x impact 1-5) and derive a risk score + label.
- Model light-weight action items (owner + deadline + task) with validation helpers.

## Acceptance Criteria

- [ ] `SourceReliability` union type exposes A–F values and `describeSourceReliability(code)` returns standard IC-derived language for each code.
- [ ] `isSourceReliability(value)` type guards arbitrary strings and rejects invalid letters.
- [ ] `ConfidenceLevel` union type exposes `"high" | "moderate" | "low"`; helper mirrors reliability behavior.
- [ ] `evaluateRiskMatrix({ likelihood, impact })` validates both coordinates (1-5), returns `score = likelihood * impact`, and classifies the result into labeled bands.
- [ ] Invalid likelihood/impact values throw descriptive errors.
- [ ] Action items are produced via `createActionItem({ owner, task, deadline })`, trimming inputs, ensuring owner/task are non-empty, and asserting ISO 8601 deadlines.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts` exercises happy-paths and error cases for every helper.
- [ ] `pnpm test` passes.

## Security & Compliance

- No IO, randomness, or environment access; everything is pure + deterministic.
- No secrets or tenant data handled here.

## Test Plan

- Vitest unit suite described above; ensure each exported helper is covered with positive + negative assertions.
