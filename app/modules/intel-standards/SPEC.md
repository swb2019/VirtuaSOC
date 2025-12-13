# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives so downstream generators,
renderers, and integrations can rely on a single source of truth for reliability,
confidence, risk scoring, and remediation actions.

## Scope

- Normalize Source Reliability codes (A-F) with doctrinal descriptions.
- Normalize Confidence levels (High/Moderate/Low) with doctrinal
  descriptions.
- Represent a 5x5 risk matrix where likelihood and impact are constrained to
  values 1-5 and derive a deterministic risk score + severity label.
- Represent actionable mitigation tasks by owner + deadline, ensuring ISO 8601
  serialization for scheduling.
- Pure, deterministic helpers only; no IO, randomness, or time-based logic
  beyond ISO conversion of provided dates.

## Acceptance Criteria

- [ ] `createSourceReliability(code)` accepts case-insensitive strings A-F and
  returns `{ code, description }`, throwing for invalid codes.
- [ ] `createConfidence(level)` accepts case-insensitive strings
  High/Moderate/Low and returns `{ level, description }`, throwing for invalid
  levels.
- [ ] `createRiskAssessment({ likelihood, impact })` enforces 1-5 bounds for
  each axis, computes `riskScore = likelihood * impact`, and maps scores to
  severities: `1-5 -> low`, `6-10 -> moderate`, `11-15 -> high`, `16-25 -> critical`.
- [ ] `createActionItem({ owner, action, deadline })` trims/validates text,
  converts deadline strings to ISO 8601, and throws on invalid input.
- [ ] Export read-only arrays describing the reliability and confidence scales
  for UI/reference usage.
- [ ] Vitest unit tests cover happy-path and invalid inputs for every helper.
- [ ] `pnpm test` passes.

## Security & Compliance

- Deterministic, in-memory logic only.
- No secrets, network calls, filesystem writes, or logging.
- All validation errors throw synchronously; no partial state.

## Test Plan

- Tests live in `app/modules/intel-standards/tests/intel-standards.test.ts`
  and cover every exported helper plus representative invalid inputs.
