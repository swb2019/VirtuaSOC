# intel-standards

Shared intelligence tradecraft primitives for VirtuaSOC.

This module defines:

- Source reliability scale (A–F) with helper descriptions + guards.
- Confidence level scale (high/moderate/low).
- Risk matrix evaluator for 5x5 likelihood/impact inputs that yields derived scores + labeled bands.
- Lightweight `ActionItem` constructor that enforces owner, task, and ISO 8601 deadlines.

All helpers are pure TypeScript utilities so other modules can reason about outputs consistently.
