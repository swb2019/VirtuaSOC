# intel-standards module

Domain primitives shared across VirtuaSOC products:

- Source reliability scale (A–F) aligned with AF standards.
- Confidence levels (High/Moderate/Low) for judgments.
- Risk matrix helpers (likelihood x impact) + derived score severities.
- Action item helper ensuring owner/deadline are normalized.

All helpers are pure functions with Vitest coverage; see `../SPEC.md` for the
full acceptance criteria.
