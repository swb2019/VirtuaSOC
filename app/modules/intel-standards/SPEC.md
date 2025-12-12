# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability, confidence,
risk matrix, and action items) that other VirtuaSOC modules can reuse without
duplicating domain logic.

## Scope

- Pure TypeScript types and helpers; no IO, persistence, or network calls.
- Deliver:
  - Source reliability scale (A-F) with descriptive metadata.
  - Confidence scale (High/Moderate/Low) with consistent keys.
  - 5x5 risk matrix utilities that derive a risk score and qualitative tier.
  - Action item type enforcing owner + deadline semantics.

## Acceptance Criteria

- [ ] Export `SourceReliability` union type plus metadata map for A-F scale.
- [ ] Export `ConfidenceLevel` union with metadata for the three mandated
      confidence values.
- [ ] Export `RiskMatrix` utilities that:
  - Validate likelihood/impact inputs between 1-5.
  - Compute deterministic risk scores (likelihood * impact).
  - Map numeric scores to qualitative tiers.
  - Provide a `build()` method that returns the full 5x5 grid.
- [ ] Export `ActionItem` interface plus `createActionItem` helper that enforces
      non-empty owner/deadline strings and ISO-8601 deadline format.
- [ ] Unit tests cover all helpers, edge cases, and validation.
- [ ] `pnpm test` passes.

## Security & Compliance

- Module remains deterministic and side-effect free.
- No secrets, logging, or network access.
- All validation failures throw descriptive errors (no console logging).

## Test Plan

- Implement Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
