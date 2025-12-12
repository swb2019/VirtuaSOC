# intel-standards

Domain primitives for VirtuaSOC intelligence products:

- AF source reliability (A-F) with canonical descriptions.
- Confidence levels (high/moderate/low) plus validation helper.
- 5x5 risk matrix helpers that return both numeric and qualitative scores.
- Action item factory with ISO deadline normalization and overdue checks.

Everything is pure TypeScript with zero IO so other modules can safely compose
these building blocks.
