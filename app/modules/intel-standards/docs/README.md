# intel-standards

Canonical primitives for VirtuaSOC intelligence production. The module exposes
metadata for standard AF source reliability (A–F), ICD-203 confidence levels,
a 5×5 risk matrix helper, and an action-item helper with deadline awareness.

## Contents

- `SOURCE_RELIABILITY_SCALE` and `getSourceReliability(code)` return friendly
  names/descriptions for each A–F rating and include a runtime validator.
- `CONFIDENCE_SCALE` documents High/Moderate/Low analytic confidence values.
- `calculateRiskScore` and `buildRiskMatrix` provide deterministic risk math.
- `createActionItem` and `isActionItemOverdue` keep follow-up work structured.

All exports are pure, side-effect free, and safe to serialize for audit trails.
