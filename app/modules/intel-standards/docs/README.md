# intel-standards

Canonical primitives for VirtuaSOC intelligence production:

- AF source reliability scale (`SourceReliability`) plus helper map for descriptions.
- ICD-203 style confidence levels (`ConfidenceLevel`).
- ISO-31000 inspired 5x5 risk matrix helpers (`calculateRiskScore`, `buildRiskMatrix`).
- Action item helpers to keep owner/deadline data consistent across products.

All helpers are pure TypeScript utilities so other modules can compose them without pulling in infrastructure dependencies.
