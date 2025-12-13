# intel-standards

Pure TypeScript primitives that encode the intelligence community standards
needed by VirtuaSOC:

- **Source reliability scale (A–F)** with canonical metadata lookups.
- **Analytic confidence levels** (high/moderate/low).
- **5×5 likelihood-impact risk matrix** helpers that derive numeric scores and
  qualitative bands.
- **Action items** with owner + ISO deadline validation.

These structs form the shared vocabulary for downstream generators, renderers,
and delivery adapters. All helpers are pure and easily testable.
