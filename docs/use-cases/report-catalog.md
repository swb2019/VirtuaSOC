# Standardized GSOC report catalog (config-driven)

VirtuaSOC IPF is built to generate a **standard Fortune 500 GSOC intelligence catalog** as **configuration**, not bespoke code.

## Principle: every report is config
Each report type is represented by a tenant-scoped `ProductConfig` record plus:
- a `PromptVersion` (prompt text + JSON schema)
- a markdown `templateMarkdown` (rendered server-side)
- `scope` rules (evidence window, tags, signal prioritization)
- `distributionRules` (channels + optional export preferences)
- `reviewPolicy` (e.g., people/PII requires review)

The worker pipeline (`products.generate`) is generic and reads these configs at runtime.

## “Gold standard first” rollout
This tenant is optimized for **DIS-first** (Daily Intelligence Summary as the quality bar). Other report types are created **disabled by default** and enabled per-tenant after tuning.

## Product types (starter catalog)
Seeded (enabled):
- `daily_intel_summary`
- `flash_alert`
- `weekly_intel_report`

Seeded (disabled; enable after tuning):
- `executive_brief`
- `travel_risk_advisory`
- `facility_threat_bulletin`
- `route_disruption_alert`
- `reputation_watch`
- `counterfeit_alert`
- `vendor_risk_snapshot`
- `crisis_sitrep`
- `investigation_casefile`

## Scope knobs (deterministic)
Stored in `ProductConfig.scope` (JSON). Supported keys:
- `windowHours` / `windowDays`: time window for evidence selection
- `maxEvidence`: cap evidence items
- `triageStatus`: `"new"` or `"triaged"` (optional filter)
- `tagsAny`: evidence must match at least one tag (optional)
- `tagsAll`: evidence must include all tags (optional)
- `includeSignalKinds`: prioritize evidence linked to specific signal kinds (optional)
- `signalMinSeverity`: minimum severity for signal prioritization
- `rubric`: stricter validation options per product type
  - `requireKeyJudgmentEvidenceRefs`
  - `requireEvidenceRefsMatchUsed`

## Distribution knobs
Stored in `ProductConfig.distributionRules` (JSON). Current keys:
- `channels`: `["email","webhook","teams"]`
- `includeDocxEmailAttachment`: when true, email distribution attaches DOCX in addition to PDF

## How to add a new standardized report type (no bespoke code)
1. In Factory, go to `/products` and seed defaults (and catalog if desired).
2. Create a new `ProductConfig` (or extend the seed list) with:
   - `productType` (new string)
   - `scope` window + rubric
   - a `PromptVersion` (reuse the DIS prompt to start)
3. Generate a draft and iterate:
   - adjust `scope.includeSignalKinds` and thresholds to reduce noise
   - adjust `templateMarkdown` to match your corporate standard
4. Enable distribution and (optional) tenant DOCX template override:
   - upload the template at `/admin/docx-template`

## Why this scales to 35+ standardized products
The platform’s “best-on-market” advantage is that quality, tradecraft, and formatting are enforced by:
- shared schema + validators
- deterministic evidence selection
- per-tenant templates
- review workflow + exports

…while new report types are only configs + templates.

