# intel-standards

Provides reusable primitives aligned with intelligence community standards:

- AF source reliability grades (A–F) and helper descriptions.
- Confidence levels (High/Moderate/Low).
- Likelihood × Impact risk scoring helpers with severity buckets.
- Structured `ActionItem` builder that normalizes deadlines to ISO strings.

Consumers can rely on these helpers for consistent scoring and output structure
across generated products (DIS, Flash Alerts, etc.). All helpers are synchronous
and require no external dependencies.
