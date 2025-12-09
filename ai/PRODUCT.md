<!-- AMD-MANAGED:PRODUCT v2 -->
# VirtuaSOC  OSINT Intelligence Products SaaS

## Product
A multi-tenant SaaS web application that automates generation, storage, and delivery of standardized intelligence products (35 product types) using:
- Make.com (orchestration triggers / webhooks)
- Notion (templated outputs + dashboards)
- Hugging Face (AI drafting)
- Public OSINT feeds (RSS/APIs) and customer-provided sources

## Mandatory output elements (for every generated product)
- Blinded source reliability scale (AF)
- Confidence level (High/Moderate/Low)
- 5x5 risk matrix (Likelihood 15 x Impact 15) + derived risk score
- Key Judgments (35 bullets)
- Actions with Owner + Deadline
- Standards alignment notes (ICD-203 style judgments; ISO-31000-style risk framing; OSAC-style templates)

## Security / compliance nonnegotiables
- Use only authorized/public data sources + customer-provided integrations; respect ToS and privacy laws.
- No secrets in repo. All tokens via env vars / secrets.
- Auditability: persist every run, input provenance (blinded), model/version, and output hash.
- Multi-tenant isolation: tenant-scoped data, strict access controls, safe logging/redaction.

## MVP definition (first shippable)
- Admin UI: manage tenants, data sources, product templates, schedules/triggers
- Generate at least TWO products end-to-end:
  1) Daily Intelligence Summary (DIS)
  2) Flash Alert
- Delivery targets:
  - Notion page creation (integration)
  - PDF export (server-side) + email send (provider interface)
- All of the above fully testable locally with mocks (no real tokens required).
