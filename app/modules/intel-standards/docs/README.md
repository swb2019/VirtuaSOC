# intel-standards module

Provides the intelligence standards primitives used across VirtuaSOC:

- AF source reliability scale (A-F) with canonical descriptions.
- Confidence level descriptors (High/Moderate/Low) with ordinals for sorting.
- Utilities to compute 5x5 likelihood/impact risk scores and derived buckets.
- Action item helper (`createActionItem`) that enforces owner/description/deadline rules plus `isActionItemOverdue`.

Everything is deterministic and pure; there are no IO calls or external dependencies beyond the JavaScript `Date` primitive.
