# intel-standards

Domain primitives that encode intelligence tradecraft scales used across VirtuaSOC.

Exports include:

- Source reliability scale (grades A–F) and descriptors.
- Confidence levels (High/Moderate/Low) with narrative guidance.
- 5x5 likelihood/impact risk matrix utilities plus derived `RiskScore` classification.
- Action item helpers that validate owner/deadline metadata.

These utilities are pure TypeScript functions so they can be reused in generators, renderers, and delivery adapters without introducing IO or shared mutable state.
