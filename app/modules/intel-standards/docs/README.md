# intel-standards

Foundational primitives for VirtuaSOC intelligence products. The module defines
shared domain vocabularies and helpers so other packages can reason about
source reliability, analytic confidence, risk scoring, and follow-on action
items without re-implementing the rules.

Included building blocks:

- Source reliability scale (A through F) with descriptors plus lookup helpers.
- Confidence levels (High/Moderate/Low) mapped to ICD-203 friendly wording.
- 5x5 risk matrix helpers that calculate scores (likelihood x impact) and
  categorize into Low/Moderate/High/Critical bands.
- Action item model + validation helpers for owner, description, and ISO 8601
  deadlines, plus an overdue check suitable for renderers.

The module is pure TypeScript with zero side-effects so it can be reused across
pipelines, renderers, and integrations.
