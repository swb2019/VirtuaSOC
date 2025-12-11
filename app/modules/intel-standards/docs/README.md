# intel-standards

Domain primitives for VirtuaSOC intelligence tradecraft. The module keeps the AF
source reliability scale, ICD-203 confidence language, a simple 5x5 risk matrix,
and structured action items co-located so downstream generators/renderers share
one canonical definition set.

Exports include:

- `SOURCE_RELIABILITY_SCALE` and `SourceReliabilityDescriptor`.
- `CONFIDENCE_DESCRIPTORS` aligned with High/Moderate/Low judgments.
- `deriveRiskScore()` and `createRiskMatrix()` for 5x5 likelihood/impact scoring.
- `createActionItem()` ensuring owner/deadline hygiene for tasking outputs.

All helpers are pure and synchronous, making the module safe to reuse across
pipelines, renderers, and adapters.
