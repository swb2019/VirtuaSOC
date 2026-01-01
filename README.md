# VirtuaSOC — Cloud SaaS Virtual Intelligence GSOC

VirtuaSOC is a **cloud SaaS Virtual Intelligence GSOC** for Fortune 500 physical security + intelligence teams.

This repo is designed for:
- **Kubernetes + Helm** deployment (cloud-agnostic)
- **Enterprise OIDC SSO** (Okta/Entra/etc.)
- **DB-per-tenant** isolation (each tenant has its own Postgres database)
- Evidence-backed intelligence products via **ReportFactory + report definition DSL**
- Modular “Autonomous Modular Delivery” iteration (`docs/amd/README.md`)

## Monorepo layout
- `apps/api`: SaaS API (control-plane + tenant routing, OIDC JWT verification, tenant onboarding)
- `apps/worker`: background workers (ingest/draft/distribute) across tenants
- `apps/web`: analyst web app (OIDC PKCE; `/api/*` backend)
- `apps/factory`: **Intelligence Product Factory** app (Next.js App Router; AMD modules M0..Mn)
- `packages/core`: contracts (schemas + fixtures + contract tests)
- `packages/reporting`: ReportFactory + definitions + quality/eval harness
- `integrations/*`: Teams/email/webhook distribution
- `infra/k8s/helm/virtuasoc`: Helm chart


