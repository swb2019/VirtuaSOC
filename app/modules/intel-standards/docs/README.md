# intel-standards module

Provides canonical intelligence tradecraft primitives for VirtuaSOC:

- Source reliability scale (A–F) with narrative descriptors.
- Analytic confidence levels (High / Moderate / Low).
- 5x5 likelihood/impact risk matrix helpers + derived risk bands.
- Validated action items tying owners to deadlines.

The module only exports pure data helpers, making it safe to use across
renderers, generators, and integrations. See `SPEC.md` and `CONTRACT.md` for the
expected behavior and API surface.
