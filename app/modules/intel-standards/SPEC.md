# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (reliability, confidence, risk scoring, and action tracking) that can be reused across VirtuaSOC generation, rendering, and delivery code.

## Scope

- Source reliability scale (grades A–F) aligned with AF/ICD conventions.
- Confidence levels (High/Moderate/Low) with textual descriptors.
- 5x5 likelihood/impact risk matrix that yields deterministic `RiskScore` objects.
- Action item representation capturing owner + deadline with ISO validation.
- All exports are in-memory utilities; no IO, logging, or network calls.

## Acceptance Criteria

- [ ] `describeSourceReliability(grade)` returns the descriptor for all grades A–F and throws for invalid input.
- [ ] `describeConfidence(level)` returns a descriptor for each allowed confidence level.
- [ ] `calculateRiskScore(likelihood, impact)` multiplies the values to derive a 1–25 score and maps it into qualitative buckets: Low (≤5), Guarded (6–10), Moderate (11–15), High (16–20), Critical (21–25).
- [ ] `buildRiskMatrix()` returns a 5x5 matrix (likelihood rows 1–5, impact columns 1–5) populated via `calculateRiskScore`.
- [ ] `createActionItem({ action, owner, deadline })` trims and validates input, ensuring deadline is a valid ISO 8601 date string.
- [ ] Vitest unit tests cover the reliability/confidence lookups, risk scoring boundaries, risk matrix shape, and action item validation.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, credentials, or external data sources.
- Module is deterministic and pure; consumers handle persistence/logging.

## Test Plan

- Vitest tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
