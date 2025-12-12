# intel-standards

Canonical domain primitives for VirtuaSOC intelligence products.

This module exports:

- Source reliability scale (`A`–`F`) + helper descriptions.
- Confidence levels (`high | moderate | low`) with explanations.
- 5x5 risk matrix helpers that evaluate likelihood/impact pairs and derive risk
  ratings.
- Action item model with normalization, validation, and overdue detection.

All utilities are pure TypeScript functions designed for composition by higher
level generators, renderers, and delivery layers.
