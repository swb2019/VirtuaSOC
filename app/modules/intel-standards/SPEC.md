# Module: intel-standards

## Goal

Provide reusable intelligence-analysis primitives so every product can speak a
common language for source reliability, analytic confidence, risk scoring, and
follow-on action items.

## Scope

- Pure TypeScript module; no IO, persistence, or network calls.
- Canonical enumerations for:
  - Source reliability (AF scale A-F).
  - Analytic confidence (High / Moderate / Low).
- Risk tooling:
  - Create a 5x5 likelihood/impact matrix with derived numeric scores (1-25).
  - Map scores to risk ratings via configurable thresholds.
- Action item helpers with owner, description, and ISO 8601 deadline support.
- Vitest unit tests validating every primitive.

## Acceptance Criteria

- [ ] `SourceReliabilityCode` union and lookup helper returning label +
      description for codes A-F.
- [ ] `ConfidenceLevel` union and lookup helper for descriptions.
- [ ] `createRiskMatrix()` generates a deterministic 5x5 matrix of
      `RiskCell`s with usable ratings and optional threshold overrides.
- [ ] `evaluateRisk()` (or equivalent) returns score + rating for a single
      likelihood/impact pair.
- [ ] `ActionItem` type plus helpers to create an item and detect if it is
      overdue relative to a reference clock.
- [ ] Unit tests cover:
  - Reliability + confidence descriptors.
  - Risk scoring math + threshold overrides + matrix dimensions.
  - Action item creation + overdue detection edge cases.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, randomness only for timestamps supplied by callers.
- All timestamps surfaced as ISO 8601 strings.
- Designed to be deterministic and easily serializable for auditing.

## Test Plan

- Vitest suite under `app/modules/intel-standards/tests/intel-standards.test.ts`.
