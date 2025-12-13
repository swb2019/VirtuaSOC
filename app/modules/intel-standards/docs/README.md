# intel-standards

Domain primitives for intelligence standards that VirtuaSOC products rely on. The module defines:

- Allied source reliability scale (A–F) with helper `getSourceReliability(code)`.
- Analytic confidence levels (`high`, `moderate`, `low`) with helper `getConfidence(level)`.
- Risk scoring utilities for the required 5x5 likelihood/impact matrix.
- An `ActionItem` constructor that enforces owner and ISO 8601 deadline metadata.

All helpers are pure, deterministic, and IO-free so they can be reused by generators, renderers, and delivery components.
