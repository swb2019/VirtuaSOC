# intel-standards module

Shared primitives that ensure every VirtuaSOC intelligence product expresses
tradecraft metadata the same way.

## Capabilities

- **Source reliability:** Authoritative scale A–F with descriptors for reports.
- **Analytic confidence:** Canonical descriptions for High/Moderate/Low.
- **Risk scoring:** 5x5 likelihood/impact matrix plus derived ratings.
- **Action tracking:** Normalized action items ensuring owner + ISO deadline.

## Usage

```ts
import {
  describeSourceReliability,
  describeConfidence,
  calculateRiskScore,
  createRiskMatrix,
  createActionItem,
} from "app/modules/intel-standards";

const reliability = describeSourceReliability("A");
const confidence = describeConfidence("moderate");
const risk25 = calculateRiskScore(5, 5); // => 25
const matrix = createRiskMatrix();
const action = createActionItem({
  action: "Notify tenants",
  owner: "SecOps Lead",
  deadline: "2025-01-31T00:00:00.000Z",
});
```

All functions are pure and require no IO or configuration.
