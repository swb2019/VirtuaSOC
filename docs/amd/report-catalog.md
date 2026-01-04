# Report catalog (config-driven, Fortune 500 GSOC)

VirtuaSOC IPF is designed so **adding a new standardized report type is configuration**, not bespoke code.

Each report type is represented by a tenant-scoped `product_configs` row plus (optionally) a `prompt_versions` row and a template.

## 1) The contract: `ProductConfig`

Each report type is a `product_type` (string) such as:
- `daily_intel_summary`
- `flash_alert`
- `weekly_intel_report`

and is configured by:
- **scope** (evidence selection + rubric enforcement)
- **template_markdown** (standardized output layout)
- **prompt_version_id** (LLM behavior + JSON schema)
- **distribution_rules** (channels + DOCX attachment behavior)
- **review_policy** (review required rules)

### Evidence selection scope (deterministic)
The worker reads these scope keys (all optional):
- `windowHours` / `windowDays`: time window for evidence selection
- `maxEvidence`: evidence cap (1..200)
- `triageStatus`: `"new"` or `"triaged"` (omit for all)
- `tagsAny`: include evidence having any of these tags
- `tagsAll`: include evidence having all of these tags
- `includeSignalKinds`: prioritize evidence linked to these signal kinds (e.g. `facility_geofence`, `route_corridor`)
- `signalMinSeverity`: minimum severity for signal prioritization

### Rubric enforcement scope (best-on-market tradecraft)
Add a `rubric` object under `scope`:
- `rubric.requireKeyJudgmentEvidenceRefs` (boolean): each key judgment must cite at least one `EVD-###`
- `rubric.requireEvidenceRefsMatchUsed` (boolean): `evidenceRefs` must exactly equal the set of refs used in the output

By default, `daily_intel_summary` runs in strict mode unless overridden.

### Distribution rules (PDF + optional DOCX)
The worker always exports **PDF** for distribution. DOCX behavior is controlled by:
- `distribution_rules.includeDocxEmailAttachment` (boolean): when distributing to email targets, attach a DOCX alongside the PDF.

DOCX rendering uses Pandoc. Tenants can optionally provide a corporate Word reference template (`tenant_docx_templates`) which the worker uses as `--reference-doc`.

## 2) The contract: prompt + schema versioning
`prompt_versions` stores:
- `prompt_text`: the system prompt (tradecraft rules live here too)
- `json_schema`: tool schema used for tool-calling generation
- `schema_version`: version string to track breaking changes

Best practice:
- create a new `prompt_versions` record for any significant change
- update `product_configs.prompt_version_id` to point to the new version
- store a short changelog (why it changed)

## 3) How to add a new report type (step-by-step)
1. Choose a `product_type` string (stable identifier).
2. Create or reuse a `prompt_versions` row.
3. Create a `product_configs` row:
   - set a deterministic `scope` window + filters
   - set `template_markdown` (or rely on the worker’s base template)
   - set `distribution_rules` and `review_policy`
4. Generate a draft product from `/products` (or from an auto-trigger signal).
5. Review output in `/products/[id]`:
   - verify rubric pass/fail + citations
   - verify evidence-bound narrative (no URLs)
6. Enable distribution (PDF email + optional DOCX).

## 4) Recommended Fortune 500 GSOC starter catalog
These are typical “standardized” products physical security + intelligence GSOCs produce:
- Daily Intelligence Summary (DIS)
- Flash Alert (time-critical)
- Weekly Intel Report
- Executive Brief (weekly/monthly, C-suite)
- Facility Threat Bulletin (site-specific)
- Travel Risk Advisory
- Route/Corridor Disruption Alert (transportation)
- Reputation / Brand Watch
- Counterfeit / Product Integrity Alert
- Vendor / Partner Risk Snapshot
- Crisis SITREP
- Investigation / Case File

You can seed additional configs from the Factory UI (`/products`) without writing code.


