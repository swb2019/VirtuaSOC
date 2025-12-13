# intel-standards module docs

The `intel-standards` module centralizes intelligence tradecraft primitives so product generators, renderers, and delivery adapters can speak the same language.

## Exports

- `SOURCE_RELIABILITY_SCALE` / `describeSourceReliability(code)` – AF source reliability (A–F) labels + descriptions.
- `CONFIDENCE_SCALE` / `describeConfidence(level)` – analytic confidence scale (High/Moderate/Low).
- `calculateRiskScore(likelihood, impact)` – multiplies 1–5 likelihood/impact values to produce the canonical 1–25 `RiskScore`.
- `classifyRisk(score)` – maps scores into Low/Moderate/High/Critical bands.
- `buildRiskMatrix()` – returns the full 5×5 matrix of `RiskMatrixCell`s for renderers.
- `createActionItem({ action, owner, deadline, status? })` – normalizes owner/deadline metadata and defaults status to `pending`.

## Usage

```ts
import {
  SOURCE_RELIABILITY_SCALE,
  calculateRiskScore,
  createActionItem,
} from "app/modules/intel-standards";

const risk = calculateRiskScore(3, 5); // 15
const matrix = buildRiskMatrix(); // 25 cells
const followUp = createActionItem({
  action: "Notify tenant leadership",
  owner: "intel.ops@virtua",
  deadline: "2025-12-31",
});
```
