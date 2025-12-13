# intel-standards module

This module hosts core primitives used across VirtuaSOC intelligence products:

- AF source reliability scale (A-F) with canonical descriptions.
- Analytic confidence levels (High/Moderate/Low).
- A 5x5 risk matrix + helper to derive a risk score/band from likelihood and
  impact inputs.
- Action items with enforced owner + ISO deadline semantics.

All exports are pure functions or readonly data so they can be reused safely in
renderers, generators, or integration adapters.
