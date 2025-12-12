# intel-standards

Domain primitives that encode intelligence community standards for VirtuaSOC.

This module exposes:

- `SOURCE_RELIABILITY_SCALE` and `SourceReliability` ratings (A-F).
- `CONFIDENCE_SCALE` and `ConfidenceLevel` (high/moderate/low).
- `RiskMatrix` helpers for 5x5 likelihood/impact grids plus derived risk tiers.
- `ActionItem` + `createActionItem` to enforce owner/deadline semantics.

All helpers are pure TypeScript utilities designed for reuse by pipeline,
renderer, and integration modules.
