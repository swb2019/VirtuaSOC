# Module: intel-standards

## Goal

Provide domain primitives that encode mandatory intelligence-standard elements:
source reliability, analytic confidence, structured risk matrices, and action
items with accountable owners and deadlines.

## Scope

- Enumerate the AF-style source reliability scale (A-F) with descriptions.
- Define the ICD-203 confidence scale (High/Moderate/Low) with descriptors.
- Model a 5x5 likelihood/impact matrix, score derivation, and risk severity
  bands that map the 1-25 score space.
- Provide an `ActionItem` abstraction that guarantees owner + deadline and
  offers helper utilities to validate/create instances.
- Pure TypeScript; no IO, randomization, or dependencies on external services.

## Acceptance Criteria

- [ ] `SourceReliabilityCode` union of `"A"`-`"F"` and helper functions:
  - `getSourceReliability(code)` returns description metadata.
  - `listSourceReliabilityScale()` returns the ordered scale.
- [ ] `ConfidenceLevel` union + `getConfidenceDescriptor(level)` helper.
- [ ] Risk matrix primitives:
  - `calculateRiskScore(likelihood, impact)` returns `likelihood * impact`.
  - `createRiskCell(likelihood, impact)` returns a structure containing score
    and severity derived from thresholds (1-5 low, 6-12 moderate, 13-19 high,
    20-25 critical).
  - `buildRiskMatrix()` returns a 5x5 matrix covering all likelihood/impact
    permutations with consistent ordering.
- [ ] `ActionItem` interface + `createActionItem(input)` helper that ensures
  owner and deadline are non-empty, deadline is ISO-8601, and returns a
  normalized object.
- [ ] Vitest coverage exercises:
  - All enumerations/functions above.
  - Boundary risk severity thresholds (5, 6, 12, 13, 19, 20, 25).
  - Action item validation for missing/invalid values.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, credentials, or integrations.
- Functions are deterministic and unit-testable.
- Dates in action items are strings; validation is purely structural.

## Test Plan

- Vitest specs under `app/modules/intel-standards/tests/intel-standards.test.ts`.
