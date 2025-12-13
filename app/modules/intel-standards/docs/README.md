# intel-standards

Domain primitives that encode VirtuaSOC intelligence standards:

- Source reliability scale (A–F) with canonical descriptions.
- Analytical confidence levels (high, moderate, low).
- 5x5 risk matrix helpers that calculate scores (1–25) and severity categories.
- Action item helper for tracking required follow-ups (owner + ISO deadline).

All helpers are synchronous, deterministic, and side-effect free so downstream
pipelines can rely on consistent behavior in tests and production.
