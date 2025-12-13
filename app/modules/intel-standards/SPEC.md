# Module: intel-standards

## Goal

Provide canonical intelligence-analysis primitives (reliability scale, confidence, risk
matrix, and action items) so downstream products can compose required outputs without
rewriting domain logic.

## Scope

- Pure TypeScript module; no IO, randomness, or external dependencies.
- Enumerations and helpers for:
  - Source reliability (A–F) with NATO-style descriptions.
  - Confidence levels (High/Moderate/Low).
  - 5x5 risk matrix (likelihood 1–5 x impact 1–5) and derived risk scores/bands.
  - Action items capturing owner, deadline, and status metadata.
- Utilities to:
  - Retrieve reliability descriptors.
  - Build the canonical risk matrix.
  - Calculate risk scores and associated qualitative bands.
  - Create normalized `ActionItem` objects with validation.

## Acceptance Criteria

- [ ] Exported types:
  - `SourceReliability`, `ConfidenceLevel`.
  - `LikelihoodLevel`, `ImpactLevel`, `RiskBand`.
  - `RiskCell`, `RiskMatrix`.
  - `ActionItem` with fields `title`, `owner`, `deadline`, `status`.
- [ ] Functions:
  - `describeSourceReliability(code)` returns descriptor with narrative + mnemonic.
  - `calculateRiskScore(likelihood, impact)` returns deterministic score (likelihood * impact).
  - `riskBandForScore(score)` maps score to qualitative band (Low/Moderate/High/Severe/Critical).
  - `buildRiskMatrix()` returns all 25 `RiskCell`s with precomputed scores/bands.
  - `createActionItem(input)` enforces non-empty fields, ISO deadline, default `status="pending"`.
- [ ] Unit tests cover:
  - Each reliability code description.
  - Risk score math + band thresholds + matrix integrity.
  - Action item validation and defaulting.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, persistence, or network calls.
- Deadlines stored as ISO 8601 strings for auditability.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`.
