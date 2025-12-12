# Module: intel-standards

## Goal

Provide canonical, type-safe primitives for intelligence production artifacts so product logic can depend on a single source of truth for reliability, confidence, and risk semantics.

## Scope

- Enumerate the AF source reliability scale (A-F) with helper metadata for UI/rendering.
- Enumerate ICD-203 confidence levels (High/Moderate/Low) with helper metadata.
- Provide a 5x5 risk matrix abstraction that derives a deterministic risk score from likelihood/impact inputs.
- Provide an `ActionItem` shape with owner + deadline enforcement and helpers to create/inspect items.

## Acceptance Criteria

- [ ] `SOURCE_RELIABILITY_SCALE` exposes all letters A-F with label/description metadata and TypeScript keeps the literals.
- [ ] `CONFIDENCE_LEVELS` exposes High/Moderate/Low entries with label/description metadata.
- [ ] `calculateRiskScore(likelihood, impact)` only accepts integers 1-5 and returns the derived score (likelihood × impact).
- [ ] `buildRiskMatrix()` returns a 5x5 matrix of `RiskCell`s covering every likelihood/impact combination exactly once.
- [ ] `createActionItem({ description, owner, deadline })` rejects empty fields, normalizes the deadline to ISO-8601, and defaults status to `pending`.
- [ ] `isActionItemOverdue(item, referenceDate?)` reports `true` when the deadline is strictly earlier than the reference (default: now).
- [ ] Vitest unit tests cover the reliability scale, confidence levels, risk scoring/matrix, and action item helpers.
- [ ] `pnpm test` passes.

## Security & Compliance

- Pure in-memory utilities; no IO, system clock access only for `isActionItemOverdue` default.
- No secrets, credentials, or tenant data stored here.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
