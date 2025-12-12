# Module: intel-standards

## Goal

Capture the core intelligence standards primitives (source reliability, analytic
confidence, risk matrices, and action items) in a reusable, pure TypeScript
module so other parts of VirtuaSOC can depend on consistent semantics.

## Scope

- Provide strongly typed representations for:
  - Source reliability codes A–F with descriptive metadata.
  - Analytic confidence levels (High / Moderate / Low).
  - 5x5 likelihood/impact risk matrix cells and derived risk bands.
  - Action items that always include an owner, summary, and deadline.
- Offer pure helper functions to look up descriptors, build a full risk matrix,
  compute risk scores, and construct validated action items.
- Include comprehensive unit tests that lock the API surface and expected
  behavior.

## Non-Goals

- Persisting any of these entities (no IO or storage concerns here).
- Enforcement of product-specific workflows beyond the basic action item shape.
- Rendering logic (Markdown/JSON) for these primitives.

## Acceptance Criteria

- [ ] `SourceReliability` helper returns metadata (label, meaning) for every
      code A–F and exposes the ordered scale.
- [ ] `ConfidenceLevel` helper returns metadata for High/Moderate/Low.
- [ ] `buildRiskMatrix()` produces a 5x5 grid with monotonically increasing risk
      scores (likelihood × impact) and risk bands derived from score buckets.
- [ ] `createActionItem()` enforces non-empty owner + summary and produces ISO
      deadlines from strings or `Date` objects.
- [ ] Vitest suite in `app/modules/intel-standards/tests` covers all helpers,
      including validation failures.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, network calls, or persistence. Pure data utilities only.
- Inputs validated minimally to avoid producing unusable artifacts (e.g., empty
  owner/summary on action items, non-ISO deadlines).

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
