# intel-standards module

Canonical primitives for VirtuaSOC intelligence products:

- Source reliability scale (A-F) with doctrinal descriptions.
- Confidence levels (High/Moderate/Low) with descriptions.
- Risk assessments using a 5x5 likelihood/impact matrix and derived score.
- Action item helper that normalizes owner/action text and ISO deadlines.

Usage:

```ts
import {
  createSourceReliability,
  createConfidence,
  createRiskAssessment,
  createActionItem,
} from "../src";

const reliability = createSourceReliability("A");
const confidence = createConfidence("moderate");
const risk = createRiskAssessment({ likelihood: 4, impact: 3 });
const action = createActionItem({
  owner: "Fusion Lead",
  action: "Alert OSAC desk",
  deadline: "2025-01-31",
});
```
