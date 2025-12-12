# Module: intel-standards

## Goal

Provide canonical intelligence-tradecraft primitives (source reliability, confidence,
risk scoring, and action tracking) that other VirtuaSOC modules can reuse.

## Scope

- Pure in-memory helpers; no IO, networking, or persistence.
- Encode the AF source reliability scale and confidence levels.
- Provide utilities to derive 5x5 risk matrix scores and banding.
- Offer a normalized `ActionItem` type with basic validation.

## Acceptance Criteria

- [ ] Source reliability scale exposes codes A-F with labels/descriptions and helper
      accessors.
- [ ] Confidence levels (High/Moderate/Low) are typed and describable via helper.
- [ ] `calculateRiskScore(likelihood, impact)` returns value (1-25) plus band per
      thresholds (<=5 low, <=10 moderate, <=15 substantial, <=20 high, else critical).
- [ ] `buildRiskMatrix()` returns a 5x5 matrix of precomputed `RiskScore`s.
- [ ] `createActionItem()` normalizes owner + deadline (ISO 8601) and rejects invalid
      data.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts`.

## Security & Compliance

- No secrets, credentials, or external integrations.
- All helpers remain deterministic and side-effect free for auditability.

## Test Plan

- Unit tests live in `app/modules/intel-standards/tests/intel-standards.test.ts` and
  run via `pnpm test`.
