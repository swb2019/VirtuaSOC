# intel-standards

Canonical intelligence tradecraft primitives for VirtuaSOC.

This module packages:

- AF-style `SourceReliability` scale (A-F) with narrative descriptors.
- ICD-203 analytic `ConfidenceLevel` references.
- A 5x5 likelihood/impact risk matrix generator plus severity scoring helper.
- `ActionItem` utilities that normalize owners + deadlines for downstream renderers.

The module is intentionally pure and dependency-free so other modules can embed these
structures in generated products, renderers, or storage layers without additional
mocking requirements.
