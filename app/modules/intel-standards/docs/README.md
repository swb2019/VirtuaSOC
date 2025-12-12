# intel-standards

Canonical tradecraft primitives for VirtuaSOC intelligence products.

This module provides:

- AF source reliability scale (A-F) metadata + helpers.
- Confidence level descriptions (High/Moderate/Low).
- Risk scoring utilities (5x5 likelihood x impact matrix + derived bands).
- Action item normalization to keep owners/deadlines consistent.

All helpers are pure functions with zero IO. Downstream modules can import them to
standardize rendering and validation logic without duplicating domain constants.
