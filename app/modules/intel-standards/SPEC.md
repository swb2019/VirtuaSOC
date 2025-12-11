# Module: intel-standards

## Goal

Capture the mandatory intelligence standards primitives (source reliability,
confidence levels, risk matrix, and action items) as reusable, typed utilities.

## Scope

- Provide source reliability scale (A–F) definitions plus helper accessors.
- Provide confidence scale (High/Moderate/Low) definitions plus helper accessors.
- Provide a 5x5 likelihood x impact risk matrix and a deterministic risk score
  function that classifies Low/Moderate/High/Critical risk.
- Provide an `ActionItem` helper that enforces non-empty owner + ISO8601
  deadline strings.
- Pure TypeScript module only; no IO, persistence, or network calls.

## Acceptance Criteria

- [ ] `SourceReliabilityCode` and `ConfidenceLevel` union types exist with
  descriptive metadata available for each value.
- [ ] `calculateRiskScore(likelihood, impact)` returns an object containing
  likelihood, impact, numeric score (likelihood * impact), and a classification
  bucket:
  - 1–5 → `low`
  - 6–12 → `moderate`
  - 13–20 → `high`
  - 21–25 → `critical`
- [ ] `buildRiskMatrix()` returns a 5x5 matrix (likelihood + impact from 1–5)
  populated via `calculateRiskScore`.
- [ ] `createActionItem({ summary, owner, deadline, status? })` trims values,
  validates owner/deadline, coerces deadline to ISO8601, and defaults status to
  `planned`.
- [ ] Vitest coverage under `app/modules/intel-standards/tests` exercises all
  helpers (definitions, scoring brackets, matrix shape, action validation).
- [ ] `pnpm test` passes.

## Security & Compliance

- Module is deterministic and side-effect free.
- No logging of user-provided content.
- No secrets or network/file system access.

## Test Plan

- Vitest unit tests at `app/modules/intel-standards/tests/intel-standards.test.ts`
  covering the acceptance criteria above.
