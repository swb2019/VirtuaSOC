# intel-standards module

Domain primitives for VirtuaSOC intelligence products:

- Source reliability scale (A–F) & confidence levels (High/Moderate/Low).
- Likelihood/impact helpers for the canonical 5×5 risk matrix.
- Derived risk score utilities and matrix generation.
- Action item helper enforcing owner + ISO deadline.

All helpers are pure functions and throw `Error` when validation fails.
