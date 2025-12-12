# Module: intel-standards

## Goal

Provide canonical domain primitives for intelligence reporting standards so
upstream generators and downstream renderers can share the same terminology
(Source reliability, confidence levels, risk matrix math, and action items).

## Scope

- Type-safe enums for AF-style Source Reliability (A-F) and Confidence
  (High/Moderate/Low) with helper metadata for rendering.
- A deterministic 5x5 risk matrix helper that computes the 1-25 risk score and
  classifies it into Low/Moderate/High/Critical buckets.
- A lightweight `ActionItem` model (summary, owner, ISO deadline) plus a
  factory that normalizes `Date` inputs and validates non-empty fields.
- No persistence, IO, or dependency on external services; pure utilities only.

## Acceptance Criteria

- [ ] `SourceReliability` exposes A-F codes and `SOURCE_RELIABILITY_SCALE` maps
  each code to a title + description required by products.
- [ ] `ConfidenceLevel` exposes High/Moderate/Low and `CONFIDENCE_LEVELS`
  provides short descriptive strings.
- [ ] `createRiskMatrix()` returns data for all 25 likelihood/impact
  combinations with each cell including likelihood, impact, score (L*I), and a
  `rating` of low/moderate/high/critical using thresholds (<=5, <=12, <=20,
  else critical).
- [ ] `calculateRiskScore(likelihood, impact)` validates 1-5 inputs and returns
  the matching `RiskScore` (1-25).
- [ ] `createActionItem({ summary, owner, deadline })` trims fields, throws on
  empty owner/summary, accepts string or `Date` deadlines, and always outputs an
  ISO 8601 string.
- [ ] Unit tests cover the above behaviors and run via `pnpm test`.

## Security & Compliance

- Pure functions only; no global state, logging, or side effects.
- Never embed secrets or remote calls; data is static and inspectable.
- Action item deadlines are normalized but not validated beyond well-formed ISO
  strings to avoid timezone surprises.

## Test Plan

- Vitest unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`
  covering reliability metadata, confidence descriptors, risk scoring, and
  action item creation/validation.
