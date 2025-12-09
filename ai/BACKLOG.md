<!-- AMD-MANAGED:BACKLOG v2 -->
# Backlog (Autonomous)

**Rule:** each Autopilot run completes exactly ONE unchecked item as a PR.

## 0) Keep CI green (so automation never stalls)
- [ ] Fix any failing tests on main/PRs so AMD CI is green by default (start with alerts-core if failing).

## 1) Intelligence standards primitives (pure domain)
- [ ] Create module `intel-standards` with:
  - SourceReliability AF
  - Confidence High/Moderate/Low
  - RiskMatrix (5x5) + RiskScore
  - ActionItem (owner, deadline)
  + full unit tests

## 2) Product catalog as data (not code)
- [ ] Create module `product-catalog` with typed schema + load product definitions from `ai/PRODUCT_CATALOG.md` (or a YAML/JSON file) and tests verifying mandatory elements are representable.

## 3) Generation pipeline (mock-first)
- [ ] Create `generator-core` (interfaces) + `generator-huggingface` (mock provider + contract tests).
- [ ] Create `renderer-core` to output canonical JSON + Markdown with required sections and tests.

## 4) Integrations (interfaces + mocks first)
- [ ] `integrations-notion` adapter interface + mock + tests
- [ ] `integrations-make` webhook interface + mock + tests
- [ ] `delivery-core` interface (email/pdf) + mock + tests

## 5) MVP vertical slice: DIS
- [ ] Implement DIS end-to-end: ingest sample inputs  generate draft  render  store artifact  deliver via mock Notion+Email; tests prove required elements exist.

## 6) MVP vertical slice: Flash Alert
- [ ] Implement Flash Alert end-to-end with event trigger pathway + risk/confidence + delivery.

## 7) Web SaaS surface (minimal)
- [ ] Add `api` (REST) to trigger runs + view run history (tests included)
- [ ] Add `web` UI to view products and latest runs (smoke tests)

## 8) Multi-tenancy (MVP)
- [ ] Add tenant model + API-key auth per tenant (tests) and ensure all data is tenant-scoped.

## 9) Scale catalog + cadences
- [ ] Add remaining products in batches by cadence (daily/weekly/monthly/etc.) with schema validation tests.
