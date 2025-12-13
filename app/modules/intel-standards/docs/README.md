# intel-standards

Common tradecraft primitives for VirtuaSOC intelligence products. The module
provides:

- AF source reliability scale (A-F) with helper descriptions and type guards.
- Confidence level helpers (High/Moderate/Low).
- A 5x5 likelihood/impact risk matrix with derived risk score bands.
- Action item factory that enforces owner + deadline and normalizes timestamps.

All utilities are pure and synchronous so they can be shared between generators,
renderers, and delivery adapters without side effects.
