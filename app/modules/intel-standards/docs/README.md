# intel-standards

Domain primitives for VirtuaSOC intelligence products. The module provides:

- Source reliability lookup table (codes A-F with canonical descriptions).
- Confidence level helper to validate `high/moderate/low` judgments.
- Risk scoring utilities that build a 5x5 likelihood/impact matrix with derived bands.
- Action item constructor that enforces owner and ISO 8601 deadlines.

All helpers are synchronous, pure, and framework-agnostic. This module acts as the shared schema foundation for product generators, renderers, and delivery adapters.
