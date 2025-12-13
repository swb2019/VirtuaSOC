## intel-standards

Primitives describing OSINT intelligence standards that must be present in every VirtuaSOC product output.

### Exposed helpers

- `describeSourceReliability("A")` → metadata for AF scale.
- `describeConfidence("moderate")` → rationale text for analytic confidence.
- `createRiskMatrixCell({ likelihood, impact })` → validated 5x5 coordinate.
- `calculateRiskScore(cell)` + `deriveRiskLevel(score)` → numeric + categorical risk.
- `createActionItem({ title, owner, deadline, status? })` → normalized action items with ISO deadlines.

All helpers are deterministic + side-effect free to remain safe for shared rendering pipelines.
