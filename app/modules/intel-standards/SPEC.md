# Module: intel-standards

## Goal

Establish canonical domain primitives for intelligence production so that other
modules can reason about source reliability, analytic confidence, and 5x5 risk
scoring in a consistent, testable way.

## Scope

- Define the Allied Forces (AF) A–F source reliability scale as structured data
  with helper utilities to retrieve metadata and validate a code.
- Define the ICD-203 confidence levels (High/Moderate/Low) with descriptions.
- Provide risk scoring primitives for a 5x5 matrix, including:
  - Strongly typed likelihood/impact ratings (1–5)
  - Derived risk score (likelihood × impact)
  - Categorization bands (low/moderate/high/critical)
  - Factory for the canonical 5×5 matrix so renderers can consume it directly.
- Provide an `ActionItem` primitive that captures a description, owner, and
  deadline (ISO 8601) plus helper utilities for creation + overdue checks.
- Module must be pure TypeScript with no IO, env, or network dependencies.

## Acceptance Criteria

- [ ] Exported `SourceReliabilityCode` union covers A–F and `getSourceReliability`
  returns name + description for each code.
- [ ] `isValidSourceReliability(code)` performs a type guard for safe parsing.
- [ ] Exported `ConfidenceLevel` union covers `high`, `moderate`, `low` and
  accompanying metadata is provided via `CONFIDENCE_SCALE`.
- [ ] Risk scoring:
  - `calculateRiskScore(likelihood, impact)` returns likelihood, impact, score,
    and category; throws for values outside 1–5.
  - `buildRiskMatrix()` returns a 5×5 array ordered by likelihood asc then
    impact asc containing the derived scores.
- [ ] Action items:
  - `createActionItem({ description, owner, deadline })` trims values, requires
    non-empty description/owner, validates ISO 8601 deadline, and returns an
    immutable object.
  - `isActionItemOverdue(item, refDate?)` compares the deadline to now (or
    optional reference) using UTC timestamps.
- [ ] Unit tests cover:
  - All metadata maps
  - Risk score math + category bands + matrix shape
  - Action item creation validation and overdue behavior
- [ ] `pnpm test` passes.

## Security & Compliance

- No storage, network, or env access.
- All helpers are deterministic and easily serializable for audit trails.
- No secrets or customer data literals.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
