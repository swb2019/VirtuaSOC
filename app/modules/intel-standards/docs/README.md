# intel-standards

Canonical intelligence standards primitives for VirtuaSOC. This module exposes:

- AF source reliability scale (grades A–F) with helper to fetch the narrative.
- Analytic confidence levels (High/Moderate/Low) with narratives.
- A deterministic 5x5 likelihood/impact risk matrix plus helper to derive a
  numeric score and qualitative category.
- An `ActionItem` helper that guarantees every action has an owner, ISO 8601
  deadline, and explicit status.

Everything is pure TypeScript so higher-level modules (pipelines, renderers,
integrations) can reuse the exact same semantics without duplicating logic.
