# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives that the rest of VirtuaSOC can
reuse for products, renderers, and integrations. The module delivers the common
data structures (source reliability, confidence, risk matrix, and action items)
with deterministic helpers so downstream logic stays consistent.

## Scope

- Pure TypeScript module (no IO, network, or randomness).
- Defines source reliability (A-F) and confidence (High/Moderate/Low)
  descriptors.
- Provides a 5x5 risk matrix + risk score helper used across products.
- Defines an ActionItem model with validation helpers for owner + deadline.
- Includes exhaustive unit tests that prove the primitives behave as expected.

## Acceptance Criteria

- [ ] `describeSourceReliability(code)` returns the descriptor for codes A-F and
      throws for invalid codes.
- [ ] `describeConfidenceLevel(level)` returns descriptors for High/Moderate/Low.
- [ ] `calculateRiskScore(likelihood, impact)` multiplies the axes (1-5) and
      `determineRiskBand(score)` classifies into Low/Moderate/High/Critical using
      ISO-31000 style thresholds.
- [ ] `buildRiskMatrix()` emits a 5x5 grid of `RiskMatrixCell` objects where each
      cell carries likelihood, impact, score, and band.
- [ ] `createActionItem(input)` validates owner, description, ISO 8601 deadline,
      and defaults `status` to `"planned"`. Helper `isActionItemOverdue(item,
      referenceDate?)` returns whether the deadline has passed.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts`
      proves the above behaviors.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, network, filesystem, or randomness.
- Accepts only caller-provided data; validation errors include actionable
  messages without leaking sensitive info.

## Test Plan

- Run `pnpm test` which executes Vitest specs under
  `app/modules/intel-standards/tests/intel-standards.test.ts`.
