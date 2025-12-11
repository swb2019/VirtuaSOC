# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives so downstream pipelines can reason about source reliability, analytical confidence, and OSINT risk framing in a consistent, type-safe manner.

## Scope

- Pure domain logic only; no persistence, IO, or framework dependencies.
- Define enumerations and helpers for:
  - `SourceReliability` grades (A–F) with NATO-style descriptions.
  - `ConfidenceLevel` values (High, Moderate, Low) with structured metadata.
  - `RiskMatrix` generation for 5x5 likelihood/impact grids plus derived risk scoring.
  - Action item helpers that capture owner/deadline metadata for mandated follow-ups.
- Ship comprehensive unit tests documenting the expected behaviors.

## Acceptance Criteria

- [ ] Export `SourceReliabilityGrade` union, descriptors, and `describeSourceReliability(grade)` helper.
- [ ] Export `ConfidenceLevel` union, descriptors, and `describeConfidence(level)` helper.
- [ ] Export `computeRiskScore(likelihood, impact)` and a 5x5 `riskMatrix` containing every likelihood/impact combination with derived `RiskLevel` metadata.
- [ ] Export `createActionItem(input)` that validates description, owner, and ISO 8601 deadline strings.
- [ ] Unit tests cover happy paths and representative edge cases for every helper.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, network calls, or filesystem access.
- All helpers are deterministic and side-effect free, enabling full auditability.

## Test Plan

- Vitest unit tests under `app/modules/intel-standards/tests/intel-standards.test.ts`.
