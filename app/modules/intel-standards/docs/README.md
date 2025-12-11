# intel-standards

Doctrine-aligned intelligence analysis primitives shared across VirtuaSOC.

Includes:

- AF source reliability scale (`A`–`F`) with descriptors + lookup helper.
- ICD-203 confidence levels (High/Moderate/Low) with descriptors.
- 5x5 risk scoring helpers (`computeRiskScore`, `buildRiskMatrix`).
- `ActionItem` factory for standardized owner/deadline tracking.

All exports are pure TypeScript utilities with zero IO so downstream modules
can compose them in pipelines, renderers, and delivery adapters.
