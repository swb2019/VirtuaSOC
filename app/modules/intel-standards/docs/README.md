# intel-standards module

The `intel-standards` module centralizes the primitives VirtuaSOC needs to
describe OSINT outputs using recognizable tradecraft scales.

- **Source reliability** & **confidence** descriptors keep reporting aligned with
  AF/ICD vocab.
- A deterministic **5x5 risk matrix** plus `calculateRiskScore` guarantee that
  likelihood/impact pairs always resolve to the same risk category.
- `createActionItem` turns arbitrary inputs into validated `{ owner,
  description, deadline }` structures, while `isActionItemDueSoon` offers a
  lightweight scheduling helper for downstream automation.

All code is pure TypeScript with Vitest coverage in
`app/modules/intel-standards/tests/intel-standards.test.ts`.
