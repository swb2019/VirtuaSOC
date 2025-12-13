# Module: intel-standards

## Goal

Capture core intelligence standards primitives (source reliability, analytic confidence, 5x5 risk scoring, and action item scaffolding) in a reusable, type-safe module for VirtuaSOC builders.

## Scope

- Pure TypeScript utilities and data structures; no IO, logging, or persistence.
- Provide descriptors for the AF source reliability scale (A–F) and confidence scale (High/Moderate/Low).
- Provide helpers to calculate and classify 5x5 risk scores and to materialize an entire matrix for downstream renderers.
- Model an `ActionItem` (owner + deadline) with a constructor that normalizes/validates inputs.

## Acceptance Criteria

- [ ] `SourceReliability` union type covering A–F plus a frozen descriptor map and helper accessor.
- [ ] `ConfidenceLevel` union type for High/Moderate/Low plus descriptors.
- [ ] `calculateRiskScore(likelihood, impact)` multiplies 1–5 integers and returns a typed `RiskScore` (1–25).
- [ ] `classifyRisk(score)` maps scores into Low/Moderate/High/Critical bands.
- [ ] `buildRiskMatrix()` returns a 5x5 grid of `RiskMatrixCell`s with likelihood, impact, score, and classification.
- [ ] `createActionItem({ action, owner, deadline })` trims/validates inputs, coerces deadline to ISO-8601, and defaults status to `pending`.
- [ ] Vitest coverage for source reliability descriptors, risk score calculations/classification, matrix shape, and action item constructor (happy-path + bad deadline).
- [ ] `pnpm test` passes.

## Security & Compliance

- Deterministic, pure functions with no side effects or external integrations.
- No secrets or identifiers persisted/logged.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts` exercises all public helpers.
