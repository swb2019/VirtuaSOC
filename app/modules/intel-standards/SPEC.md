# Module: intel-standards

## Goal

Expose reusable primitives that encode intelligence community standards such as
source reliability, analytic confidence, risk matrices, and structured action
items so higher-level pipelines can compose them consistently.

## Scope

- Pure domain module (no IO, logging, or network calls).
- Define strongly-typed representations for:
  - Source reliability grades (A-F) with descriptors.
  - Analytic confidence levels (High/Moderate/Low).
  - 5x5 likelihood/impact risk matrix with derived numeric score + severity.
  - Action items capturing an owner, deadline, and narrative description.
- Provide lightweight helpers to:
  - Describe a reliability grade.
  - Calculate a risk score for a specific likelihood/impact pair.
  - Build the full 5x5 risk matrix.
  - Validate/construct an action item with ISO 8601 deadline enforcement.

## Acceptance Criteria

- [ ] `SourceReliabilityGrade` and `ConfidenceLevel` unions exported with helper
      arrays for iteration and a `describeSourceReliability` helper.
- [ ] `calculateRiskScore` returns likelihood, impact, score, and severity
      bucket, and `buildRiskMatrix` returns a 5x5 matrix of those entries.
- [ ] `createActionItem` validates owner + deadline and ensures ISO 8601
      formatting; returned `ActionItem` contains `description`, `owner`, and
      `deadline`.
- [ ] Vitest coverage in `app/modules/intel-standards/tests/intel-standards.test.ts`
      proving the behaviors above.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets and no side effects; deterministic, in-memory computations only.
- All inputs validated defensively; throw helpful errors on bad arguments.

## Test Plan

- Unit tests in `app/modules/intel-standards/tests/intel-standards.test.ts`.
