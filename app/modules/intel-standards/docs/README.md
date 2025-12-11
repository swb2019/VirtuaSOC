# intel-standards

Canonical intelligence analysis primitives shared by VirtuaSOC products:

- Source reliability scale (A–F) with descriptors.
- Confidence levels with deterministic ordering.
- Risk scoring helpers for a 5×5 likelihood/impact matrix.
- Action item definition with normalization + overdue detection.

The module is intentionally pure and IO-free so downstream generators,
renderers, and integrations can rely on consistent semantics.
