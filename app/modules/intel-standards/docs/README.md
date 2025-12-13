# intel-standards

Shared intelligence standards primitives for VirtuaSOC.

This module provides:

- Source reliability scale (`A`–`F`) with machine-readable descriptors.
- Confidence levels (`high | moderate | low`) and a runtime validator.
- A deterministic 5x5 risk matrix and helper for deriving risk scores/levels.
- An `ActionItem` constructor that enforces owner, ISO deadline, and summary.

The helpers are pure TypeScript utilities so other modules can compose them
without needing to duplicate domain logic. No persistence, IO, or secrets live
here.
