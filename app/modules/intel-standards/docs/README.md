# intel-standards

Shared intelligence tradecraft primitives used across VirtuaSOC outputs.

This module provides:

- Source reliability (A–F) metadata and helper accessors.
- Confidence (High/Moderate/Low) metadata and accessors.
- A deterministic 5x5 likelihood x impact risk matrix builder plus risk score
  classification helpers.
- A normalized `ActionItem` creator that enforces owner + ISO deadline.

All helpers are pure functions with no side effects so they can be used in
generation, rendering, and delivery layers without additional dependencies.
