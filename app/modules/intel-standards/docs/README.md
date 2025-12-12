# intel-standards module

This module hosts the canonical primitives used across VirtuaSOC intelligence
products:

- AF source reliability scale (A-F) metadata.
- Confidence levels (High/Moderate/Low) with descriptions.
- A 5x5 risk matrix helper that returns scores and ratings.
- An `ActionItem` factory that enforces owner/deadline requirements.

All exports are pure TypeScript utilities with Vitest coverage in
`../tests/intel-standards.test.ts`.
