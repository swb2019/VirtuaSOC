# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, analytic
confidence, 5x5 risk scoring, and tasking/action scaffolding) that downstream
pipelines can depend on without re-implementing doctrine-specific logic.

## Scope

- Source reliability scale (AF A–F) with human-readable descriptors.
- Analytic confidence scale (High/Moderate/Low) with descriptors.
- Likelihood/Impact scores (1–5) plus helpers for risk score + 5x5 matrix.
- Action item representation with owner/deadline metadata.
- Pure TypeScript implementation (no IO, storage, or framework coupling).

## Acceptance Criteria

- [ ] `SourceReliabilityCode` covers `A` through `F` and exposes canonical
      label/description metadata via `SOURCE_RELIABILITY_SCALE` and a helper
      `getSourceReliabilityInfo(code)`.
- [ ] `ConfidenceLevel` covers `high | moderate | low` with descriptors exposed
      as `CONFIDENCE_SCALE` and `getConfidenceInfo(level)`.
- [ ] Likelihood and impact scores are modeled as branded numeric unions
      (`1 | 2 | 3 | 4 | 5`) to prevent accidental misuse.
- [ ] `computeRiskScore(likelihood, impact)` returns an object containing:
      - the original likelihood + impact
      - the numeric risk value (`likelihood * impact`)
      - a categorical severity bucket (`low | moderate | high | critical`)
- [ ] `buildRiskMatrix()` returns a 5x5 matrix (25 cells) covering every
      combination of likelihood/impact and providing the derived `RiskScore`.
- [ ] `ActionItem` includes `action`, `owner`, `deadline` (ISO string), and
      optional `status` (`pending | in_progress | completed`).
- [ ] `createActionItem(input)` validates non-empty `action` + `owner`,
      normalizes the deadline (accepting ISO strings or `Date` objects), and
      rejects invalid/empty deadlines.
- [ ] Unit tests cover:
      - Metadata lookup for reliability + confidence
      - Risk score math + risk matrix dimensions
      - Action item creation success + failure cases
- [ ] `pnpm test` passes.

## Security & Compliance

- Module must stay pure/deterministic (no randomness, IO, or system state).
- No secrets or tenant data stored here.
- Date parsing uses built-in JS only; no external dependencies.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
