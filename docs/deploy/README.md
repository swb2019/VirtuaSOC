# Deployment

VirtuaSOC is designed to run as a SaaS web app on Kubernetes.

## Docker images
Build from the repo root (Docker context is the repo root):

```bash
docker build -f apps/api/Dockerfile -t virtuasoc-api:dev .
docker build -f apps/worker/Dockerfile -t virtuasoc-worker:dev .
docker build -f apps/web/Dockerfile -t virtuasoc-web:dev .
```

## Kubernetes (Helm)
See `infra/k8s/helm/virtuasoc`.

## Migrations (control-plane + tenant-plane)
- **Control-plane**: SQL migrations in `apps/api/migrations-control` are applied automatically by the API on startup (default `AUTO_MIGRATE_CONTROL=true`).
- **Tenant-plane**: SQL migrations in `apps/api/migrations-tenant` are applied automatically when services first connect to a tenant DB (default `AUTO_MIGRATE_TENANT=true`) by:
  - `apps/api` (tenant routing plugin)
  - `apps/factory` (before Prisma uses the tenant DB)
  - `apps/worker` (before processing jobs for a tenant)

If you need to validate a tenant DB schema (or force-apply migrations) from a shell:

```bash
node scripts/smoke-tenant-db.mjs --tenant demo --migrate
```

## Deployment runbooks
- `docs/deploy/vm-k3s.md` (single-VM budget mode)
- `docs/deploy/backups-snapshots.md` (GCE disk snapshot schedule)
- `docs/deploy/backups-pgdump.md` (nightly Postgres logical backups to GCS)
- `docs/deploy/ops-hardening.md` (minimal security + ops hardening)
- `docs/deploy/oidc-entra-id.md` (Entra ID OIDC reference setup)
- `docs/deploy/monitoring-budget.md` (monitoring + alerting, budget mode)
- `docs/deploy/report-exports.md` (report exports: Markdown + JSON)
- `docs/deploy/ai-setup-assistant.md` (AI setup assistant: RSS + defaults + distribution targets)
