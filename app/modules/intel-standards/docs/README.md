# intel-standards module

Domain primitives for VirtuaSOC intelligence products:

- AF-style Source Reliability (A-F) with helper utilities.
- ICD-203 confidence descriptors (High/Moderate/Low).
- 5x5 likelihood/impact risk matrix helpers with score + severity bands.
- Action items with enforced owner + ISO deadline + simple validation.

Exported API is documented in `../CONTRACT.md`. Use these types when building
product generators, renderers, or delivery pipelines to keep mandatory product
elements consistent and testable.
