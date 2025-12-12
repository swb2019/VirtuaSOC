# Module: intel-standards

## Goal

Provide domain-safe primitives for intelligence standards so that downstream
pipelines can reason about source reliability, analytic confidence, risk, and
required actions in a consistent, type-safe way.

## Scope

- Pure TypeScript module with no IO, logging, or network access.
- Define canonical scales for:
  - Source reliability (A-F) following the AF scale.
  - Analytic confidence (High/Moderate/Low).
  - 5x5 risk matrix with derived risk scores (likelihood x impact).
  - Action items that capture ownership and deadlines for remediation steps.
- Offer helper functions to:
  - Look up metadata for reliability + confidence codes.
  - Build a normalized risk matrix and compute individual risk scores.
  - Create validated action items and detect overdue items based on a reference
    clock.

## Acceptance Criteria

- [ ] `SourceReliability` is a string union of `"A"` through `"F"` with
      `SOURCE_RELIABILITY_SCALE` exposing meaning/description for each code.
- [ ] `ConfidenceLevel` is a string union of `"high" | "moderate" | "low"`
      with accompanying descriptors.
- [ ] `createRiskMatrix()` produces a 5x5 matrix (likelihood rows 1-5,
      impact columns 1-5) where every cell is a `RiskScore` that includes
      likelihood, impact, numeric value, and rating bucket
      (`"low" | "moderate" | "high" | "critical"`).
- [ ] `deriveRiskScore(likelihood, impact)` validates inputs (1-5) and mirrors
      the scoring logic that backs the matrix.
- [ ] `createActionItem(input)` enforces non-empty `task` and `owner`, normalizes
      deadline ISO strings, and defaults status to `"pending"`.
- [ ] `isActionItemOverdue(item, referenceDate?)` returns true when the deadline
      is strictly before the provided reference instant.
- [ ] Vitest unit tests cover all helpers and edge cases (invalid inputs,
      rating thresholds, overdue detection).
- [ ] `pnpm test` passes.

## Security & Compliance

- All helpers are deterministic and pure.
- No secrets or tenant data handled here.
- Date handling relies solely on caller-provided inputs.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`
  covering:
  - Reliability + confidence lookups.
  - Risk score math and rating buckets.
  - Risk matrix shape (5x5) and representative cells.
  - Action item validation + overdue detection.
