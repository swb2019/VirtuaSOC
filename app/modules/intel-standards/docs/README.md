# intel-standards

Canonical intelligence tradecraft primitives for VirtuaSOC outputs.

This module provides:

- AF-style source reliability scale constants with metadata.
- ICD-style confidence levels.
- Likelihood/impact risk scoring helpers plus a 5x5 matrix builder.
- Minimal Action Item model with validation so downstream pipelines can require
  owner/deadline assignments.

Everything is pure/side-effect free letting generators, renderers, and delivery
modules share consistent semantics.
