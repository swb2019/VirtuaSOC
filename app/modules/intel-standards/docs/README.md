# intel-standards module

The `intel-standards` module centralizes AF/ICD-style primitives for intelligence products:

- Source reliability scale (A-F) with friendly labels/descriptions.
- Confidence levels (High/Moderate/Low).
- Risk matrix utilities for likelihood × impact scoring.
- Action item helper enforcing owner + deadline semantics.

Usage example:

```ts
import {
  SOURCE_RELIABILITY_SCALE,
  calculateRiskScore,
  createActionItem,
} from "app/modules/intel-standards";

const score = calculateRiskScore(4, 5); // 20
const action = createActionItem({
  description: "Notify tenant about flash alert",
  owner: "Intel Ops",
  deadline: "2025-01-31",
});

console.log(SOURCE_RELIABILITY_SCALE.A.label); // "A — Completely reliable"
```
