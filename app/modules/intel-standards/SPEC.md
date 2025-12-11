# Module: intel-standards

## Goal

Provide canonical intelligence standards primitives (source reliability,
confidence, risk matrix scoring, and action items) for reuse across the
VirtuaSOC platform.

## Scope

- Define typed representations for the AF source reliability scale (grades A–F)
  plus helper descriptions.
- Define confidence levels (High/Moderate/Low) with helper descriptions.
- Define a 5x5 Likelihood × Impact risk matrix representation and a pure function
  that derives a risk score and severity bucket for any pair.
- Define an `ActionItem` data shape (description, owner, deadline, status) and a
  builder that normalizes deadlines to ISO-8601 strings.

## Acceptance Criteria

- [ ] Export `SourceReliabilityGrade` union type (`"A"` … `"F"`) and
      `describeSourceReliability(grade)` returning grade + human-readable
      description.
- [ ] Export `ConfidenceLevel` union (`"high" | "moderate" | "low"`) and
      `describeConfidenceLevel(level)` returning level + description.
- [ ] Export `calculateRiskScore(likelihood, impact)` for likelihood/impact
      values 1–5 that returns `{likelihood, impact, score, severity}` where
      `score = likelihood * impact` and severity bucket thresholds are defined
      and enforced.
- [ ] Export `buildRiskMatrix()` that returns a 5x5 matrix covering every
      likelihood/impact pair using `calculateRiskScore`.
- [ ] Export `createActionItem(input)` that accepts `{description, owner,
      deadline, status?}` with the deadline accepted as either ISO string or
      Date, validates it, normalizes to ISO, and defaults status to `"pending"`.
- [ ] All functions remain pure and side-effect free (other than non-deterministc
      id generation for action items).
- [ ] Unit tests cover each exported helper, including the risk severity bucket
      boundaries and invalid deadline handling.
- [ ] `pnpm test` passes.

## Security & Compliance

- No network, filesystem, or secret handling.
- Reject invalid deadlines for action items to prevent silently propagating bad
  data.
- Types keep consumer modules honest about accepted values.

## Test Plan

- Vitest tests under `app/modules/intel-standards/tests` covering:
  - Source reliability description lookup.
  - Confidence level description lookup.
  - Multiple risk score combinations hitting each severity bucket.
  - Entire risk matrix size (5 rows × 5 columns) and a few sampled cells.
  - Successful `createActionItem` (string & Date deadlines) and failure on
    invalid dates.
