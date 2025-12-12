# intel-standards

Canonical intelligence standards primitives for VirtuaSOC.

This module defines domain-safe primitives for:

- Source Reliability (A-F) with human-readable descriptions.
- Confidence Levels (high/moderate/low) with guidance text.
- A 5x5 risk matrix with helper utilities to compute derived risk scores.
- Action items that capture required remediation owners and deadlines.

The helpers are all pure TypeScript functions so downstream modules (e.g.,
generation, rendering, delivery) can provide consistent metadata without
re-implementing these rules.
