# intel-standards

Intelligence tradecraft primitives shared across the VirtuaSOC stack.

This module provides:

- `SourceReliability` scale (A–F) with helper descriptions.
- `ConfidenceLevel` ordering utilities.
- A canonical 5x5 risk matrix plus a `RiskScore` helper.
- A simple `ActionItem` primitive to capture owners and deadlines.

All exports are pure TypeScript utilities suitable for both runtime code and
type-level validation. No IO, secrets, or environment access occurs here.
