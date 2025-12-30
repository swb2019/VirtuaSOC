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

## Deployment runbooks
- `docs/deploy/vm-k3s.md` (single-VM budget mode)
- `docs/deploy/backups-snapshots.md` (GCE disk snapshot schedule)
- `docs/deploy/backups-pgdump.md` (nightly Postgres logical backups to GCS)
- `docs/deploy/ops-hardening.md` (minimal security + ops hardening)
- `docs/deploy/oidc-entra-id.md` (Entra ID OIDC reference setup)
- `docs/deploy/monitoring-budget.md` (monitoring + alerting, budget mode)
