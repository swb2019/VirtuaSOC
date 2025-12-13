# Module: intel-standards

## Goal

Codify the baseline intelligence standards primitives required by VirtuaSOC so
other modules can rely on shared, validated domain objects.

## Scope

- Represent the AF source reliability scale (A–F) with machine-readable
  descriptors.
- Represent confidence levels (High/Moderate/Low) with helpers for validation.
- Provide a 5x5 risk matrix made from discrete likelihood/impact (1–5) inputs
  that yields a deterministic risk score plus a normalized risk level.
- Provide an `ActionItem` type that enforces owner + deadline + summary, along
  with a constructor that validates ISO-8601 dates.
- No IO, persistence, or network calls; purely in-memory utilities.

## Acceptance Criteria

- [ ] `SourceReliability` union covers only `A`–`F` and exposes metadata
      (label + description) for each code.
- [ ] `ConfidenceLevel` union covers `high | moderate | low` and can be
      validated at runtime.
- [ ] `calculateRiskScore(likelihood, impact)`:
  - Accepts integers 1–5 (inclusive) for both likelihood and impact.
  - Returns `{ likelihood, impact, value, level }` where `value =
    likelihood * impact`.
  - Applies risk levels: `1–5 => low`, `6–10 => moderate`,
    `11–15 => high`, `16–25 => critical`.
- [ ] `RISK_MATRIX` exposes the immutable 5x5 grid of risk scores for all
      combinations.
- [ ] `createActionItem` enforces non-empty owner + summary and a valid
      ISO-8601 deadline, defaulting status to `pending`.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts`
      exercises the behaviors above (happy-path + validation failures).
- [ ] `pnpm test` passes.

## Security & Compliance

- Keep all helpers pure and deterministic.
- No random IDs, network calls, or logging.
- Validate user-provided strings defensively so downstream modules can trust
  the primitives.

## Test Plan

- Vitest unit tests that cover:
  - Source reliability + confidence helpers.
  - Multiple points in the risk matrix + failure paths.
  - Action item creation success and validation errors.
