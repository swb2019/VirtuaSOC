# Module: intel-standards

## Goal

Capture core intelligence standards primitives (source reliability, confidence, and 5x5 risk matrix modeling) in one reusable, typed module.

## Scope

- Define Source Reliability scale (codes A-F) with NATO-style descriptions.
- Define Confidence scale (High/Moderate/Low) as reusable literals.
- Provide helpers to model a 5x5 risk matrix (likelihood 1-5 x impact 1-5) and derive a numeric risk score/category.
- Provide an ActionItem structure with owner/deadline validation utilities.
- Pure in-memory utilities only (no IO/network).

## Acceptance Criteria

- [ ] Export `SourceReliabilityCode`, `SourceReliabilityDescriptor`, and `SOURCE_RELIABILITY_SCALE` covering A-F with narrative text.
- [ ] Export `ConfidenceLevel` union literal type with ordered helper constant.
- [ ] Export `createRiskAssessment(input)` that:
  - Validates likelihood/impact are integers 1-5.
  - Returns `{ likelihood, impact, score (likelihood*impact), category }` where category thresholds are: Low (1-5), Moderate (6-12), High (13-20), Critical (21-25).
- [ ] Export `createActionItem({ description, owner, deadline })` that ensures description/owner are non-empty strings and deadline is a valid ISO-8601 timestamp.
- [ ] Unit tests cover:
  - Reliability scale contents and lookups.
  - Risk assessment scoring/categories at boundary values.
  - Action item validation success/failure paths.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets or external integrations.
- Inputs are validated defensively to avoid invalid intelligence artifacts.
- Module stays deterministic/pure to keep auditability simple.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
