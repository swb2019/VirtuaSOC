# Autonomous Modular Delivery (AMD)

VirtuaSOC evolves via **independent, vertical modules** (`M0..Mn`).

Each module ships with:
- clear contract (API + DB schema + events)
- a feature flag
- tests (unit + integration where applicable)
- minimal UI slice
- migration(s)
- a short README for the module

## Current roadmap (Intelligence Product Factory)

### M0 — Repo scaffold + quality gates
- Next.js app scaffold: `apps/factory/`
- Prisma scaffolding (control + tenant schemas)
- Docker compose for local infra
- CI build/test gates
- Flag: `FEATURE_FACTORY_APP`

### M1 — Auth + tenancy + RBAC (Entra + NextAuth)
- Entra SSO via NextAuth
- Control-plane: tenants, memberships, invitations
- Tenant resolution via host/subdomain + `X-Tenant-Slug` fallback
- Flag: `FEATURE_RBAC`

### M2 — Evidence ingest
- Webhook, RSS job, manual entry
- Normalize + dedupe by content hash + URL
- Flag: `FEATURE_EVIDENCE_INGEST`

### M3 — Entity linking
- CRUD entities + evidence↔entity links
- Flag: `FEATURE_ENTITY_LINKING`

### M4 — Signal detection (rule-first)
- Deterministic rules + scoring with explainable reasons
- Flag: `FEATURE_SIGNALS`

### M5 — Product Factory (config-driven)
- Single generation pipeline driven by `ProductConfig`
- Pluggable LLM provider (default OpenAI `gpt-5.2`)
- Flag: `FEATURE_PRODUCT_FACTORY`

### M6 — Review workflow + distribution
- Draft → Review → Approved → Distributed
- PDF export + SMTP/webhook distribution
- Immutable run logs
- Flag: `FEATURE_REVIEW_DISTRIBUTION`


