# Module: intel-standards

## Goal

Provide shared intelligence standards primitives (reliability, confidence, risk,
and action tracking) that other modules can consume without re-implementing
domain rules.

## Scope

- Pure TypeScript utilities and type definitions only.
- No network, filesystem, database, or environment variable usage.
- Focus on:
  - Source reliability scale (A–F).
  - Confidence scale (High/Moderate/Low).
  - 5x5 risk matrix utilities with derived risk scores.
  - Action item helpers (owner + deadline normalization).

## Acceptance Criteria

- [ ] `SourceReliability` is a union type `"A"`–`"F"` plus helper maps describing
      each code and a type guard `isSourceReliability(value)`.
- [ ] `ConfidenceLevel` is a union type `"high" | "moderate" | "low"` with a
      whitelisted array `CONFIDENCE_LEVELS`.
- [ ] `calculateRiskScore(likelihood, impact)` accepts integers 1–5 and returns:
      `{ likelihood, impact, score, level }`, where score = likelihood * impact
      and `level` maps scores to five severity bands.
- [ ] `buildRiskMatrix()` returns a 5x5 array (likelihood rows, impact columns)
      covering every valid pair exactly once.
- [ ] `createActionItem({ action, owner, deadline })` trims inputs, validates
      non-empty owner & action, normalizes `deadline` to ISO 8601 (UTC) whether
      provided as string or `Date`, and rejects invalid dates.
- [ ] `isActionItemOverdue(item, now?)` returns true when the deadline is in the
      past relative to `now` (default: current time).
- [ ] Vitest unit tests cover all happy paths and major validation failures.

## Security & Compliance

- No secrets baked into the module; values are static domain constants.
- All functions are deterministic and side-effect free, aiding audit trails.
- Deadline handling uses ISO strings to keep logs consistent.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`
  covering reliability guards, confidence lists, risk scoring, matrix build, and
  action item helpers.
