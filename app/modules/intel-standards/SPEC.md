# Module: intel-standards

## Goal

Provide canonical, reusable primitives for VirtuaSOC intelligence products that align
with AF source reliability, ICD-203 confidence language, and ISO 31000 style risk
framing so downstream generators/renderers can depend on consistent semantics.

## Scope

- Enumerate the AF source reliability scale (A-F) with typed descriptors.
- Define confidence levels (High/Moderate/Low) and helper metadata.
- Model a 5x5 risk matrix (likelihood x impact) with a deterministic risk score.
- Provide lightweight validation/helpers for action items (owner, deadline, status).
- Pure, in-memory utilities only (no IO, network, or storage logic).

## Acceptance Criteria

- [ ] `SourceReliabilityCode` union type of "A"-"F" with descriptive metadata.
- [ ] `ConfidenceLevel` union type of `"high" | "moderate" | "low"` plus
      descriptors consumers can surface.
- [ ] `deriveRiskScore(likelihood, impact)` returns `likelihood * impact` and both
      axes are constrained to 1-5.
- [ ] `createRiskMatrix()` returns a 5x5 array of cells with likelihood/impact
      ordinal values and derived scores.
- [ ] `createActionItem({ description, owner, deadline, status? })` returns an
      immutable object with trimmed owner/description and ISO 8601 deadline.
- [ ] Unit tests cover all helpers, including invalid inputs being rejected.
- [ ] `pnpm test` stays green.

## Security & Compliance

- No secrets, randomness, or IO.
- Do not log inputs; the module is intended to be embedded inside other pure
  services.
- All validation errors must be thrown synchronously (no async/await).

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`.
  - Validate enumerations/descriptors are exhaustive.
  - Ensure the risk matrix is 5x5 and risk scores match expectations.
  - Ensure `createActionItem` normalizes inputs and rejects invalid owner/deadline.
