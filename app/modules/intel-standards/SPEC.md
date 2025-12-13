# Module: intel-standards

## Goal

Provide shared intelligence standards primitives (source reliability, confidence,
risk scoring, and action tracking) that every product template can rely on.

## Scope

- Enumerate AF source reliability grades with canonical descriptors.
- Enumerate confidence levels (High/Moderate/Low) with definitions.
- Define a strict 5x5 risk matrix, derive normalized risk scores, and expose the
  derived risk category thresholds.
- Provide an `ActionItem` representation plus helper(s) that guarantee ISO
  deadlines and normalized text.

## Acceptance Criteria

- [ ] Source reliability constants expose grades **A-F** with label + description.
- [ ] Confidence levels cover **high**, **moderate**, **low** with IC-aligned
      descriptions.
- [ ] Risk matrix helper returns risk score (1-25) and category for any 5x5
      combination; matrix export covers the full grid.
- [ ] Action items require description, owner, ISO 8601 deadline, and default to
      `planned` status.
- [ ] Vitest coverage proves the above behaviors and error handling.

## Security & Compliance

- Pure, deterministic utilities with no IO or secrets.
- All validation happens in-memory; no logging of provided text.

## Test Plan

- Vitest specs in `app/modules/intel-standards/tests/intel-standards.test.ts`.
