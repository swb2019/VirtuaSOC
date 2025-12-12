# Module: intel-standards

## Goal

Provide reusable intelligence standards primitives (source reliability, confidence, risk scoring, and action tracking) that other modules can depend on.

## Scope

- Pure TypeScript models and helpers with no external IO.
- Export canonical source reliability (A-F) and confidence (High/Moderate/Low) enumerations plus descriptors.
- Offer a 5x5 risk matrix abstraction and deterministic risk score helper (likelihood × impact plus banding).
- Define a normalized `ActionItem` shape that requires an owner and deadline and helper utilities to construct it safely.

## Acceptance Criteria

- [ ] Source reliability definition exposes levels A-F along with textual descriptors via helper functions.
- [ ] Confidence scale exposes High/Moderate/Low.
- [ ] Risk matrix helper generates a 5x5 grid (likelihood 1-5 x impact 1-5) and `calculateRiskScore` returns numeric score and qualitative banding.
- [ ] `ActionItem` helper enforces non-empty owner/action values and converts deadlines to ISO 8601.
- [ ] Unit tests cover reliability descriptors, risk score math/banding, matrix shape, and action item normalization.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, IO, logging, or network usage.
- All calculations are deterministic and side-effect free.

## Test Plan

- Vitest suite in `app/modules/intel-standards/tests/intel-standards.test.ts`.
