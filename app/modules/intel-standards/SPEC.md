# Module: intel-standards

## Goal

Encode the baseline intelligence tradecraft primitives needed across VirtuaSOC
products so they can be reused consistently (and validated in tests) without
relying on ad-hoc strings.

## Scope

- Domain-only utilities; no IO, logging, env, or external services.
- Provide primitives for:
  - Source reliability grading (A-F, AF scale).
  - Confidence levels (High/Moderate/Low) with helpers.
  - 5x5 risk matrix cells with derived risk score banding.
  - Action items that always include an owner and deadline.
- Keep the API pure so templates, generators, and renderers can share it.

## Acceptance Criteria

- [ ] Type-safe definitions for `SourceReliability`, `ConfidenceLevel`, and the
      supporting guards/helpers (e.g. `isSourceReliability`).
- [ ] `describeSourceReliability(level)` returns the canonical AF definition for
      each grade (A-F) and throws for invalid input.
- [ ] 5x5 `RiskMatrix` builder that covers every combination of likelihood 1-5
      and impact 1-5, preserves ordering, and includes:
      - integer risk score (likelihood * impact)
      - severity band (`low`, `moderate`, `high`, `critical`).
- [ ] `calculateRiskScore(likelihood, impact)` returns the same
      score/category as the matrix builder and validates inputs.
- [ ] Action item factory `createActionItem({ owner, summary, deadline })`
      trims inputs, normalizes deadline to ISO 8601, enforces owner + summary
      presence, accepts optional `status` (`pending`, `in_progress`, `done`).
- [ ] Unit tests exercise:
      - Every source reliability grade lookup
      - Confidence level guard
      - Representative risk scoring (low/critical)
      - Matrix dimensions/content spot checks
      - Action item happy path + validation errors
- [ ] `pnpm test` passes.

## Security & Compliance

- Inputs are plain data; never log or transmit contents from this module.
- No secrets or environment access. Pure functions only.

## Test Plan

- Vitest specs located at `app/modules/intel-standards/tests/intel-standards.test.ts`.
