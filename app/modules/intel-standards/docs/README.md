# intel-standards

Canonical primitives required by VirtuaSOC intelligence products.

This module provides:

- `SourceReliability` scale (`A`-`F`) plus `describeSourceReliability()` helper.
- `ConfidenceLevel` utilities for mapping quantitative evidence to analytic confidence.
- 5x5 risk matrix helpers (`computeRiskScore`, `createRiskMatrix`).
- `ActionItem` model with creation + overdue detection helpers.

All exports are pure data/model helpers so other modules can reference standardized values without duplicating logic.
