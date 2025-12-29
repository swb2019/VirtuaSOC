# GKE deployment (Cloud SQL + Memorystore)

This repo deploys to Kubernetes via Helm (`infra/k8s/helm/virtuasoc`). For GKE, we recommend:
- **Cloud SQL (Postgres)** for control-plane + tenant DBs
- **Memorystore (Redis)** for BullMQ queues
- **Workload Identity** + **Cloud SQL Auth Proxy sidecars**

## Prereqs
- `gcloud`, `kubectl`, `helm`
- External Secrets Operator (ESO) if you want to sync from Secret Manager

## 1) Create / configure GKE (Workload Identity)
Create a GKE cluster with Workload Identity enabled (standard GKE docs).

## 2) Cloud SQL
- Create a Postgres instance.
- Create a **control-plane database** (e.g. `virtuasoc_control`).
- Create an **admin DB user** that can `CREATE DATABASE` + `CREATE ROLE` (used for tenant provisioning).

## 3) Grant Cloud SQL access (Workload Identity)
Create a GCP service account (GSA) with:
- `roles/cloudsql.client`

Bind it to the KSA used by the Helm release via annotation:
- `iam.gke.io/gcp-service-account: <gsa-name>@<project>.iam.gserviceaccount.com`

The chart supports this via:
- `serviceAccount.annotations`
- `gcp.cloudSqlProxy.enabled=true`

## 4) Secrets / env
Required secrets:
- `REDIS_URL` (Memorystore)
- `CONTROL_DATABASE_URL` (via Cloud SQL proxy, typically `postgres://...@127.0.0.1:5432/virtuasoc_control?sslmode=disable`)
- `POSTGRES_ADMIN_URL` (same host/port; points to `postgres` database)
- `TENANT_DSN_ENCRYPTION_KEY` (32 bytes, base64 or hex)
- `PLATFORM_ADMIN_KEY` (random string for `/admin/*`)

## 5) Helm install
Example values (adjust to your domain + images):

```bash
helm upgrade --install virtuasoc infra/k8s/helm/virtuasoc \
  --set image.api.repository=ghcr.io/<owner>/virtuasoc-api \
  --set image.worker.repository=ghcr.io/<owner>/virtuasoc-worker \
  --set image.web.repository=ghcr.io/<owner>/virtuasoc-web \
  --set gcp.cloudSqlProxy.enabled=true \
  --set gcp.cloudSqlProxy.instanceConnectionName=<project>:<region>:<instance> \
  --set serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account=<gsa>@<project>.iam.gserviceaccount.com \
  --set secrets.create=false \
  --set secrets.existingSecretName=virtuasoc-secrets
```

If you are not using ESO yet, you can set `secrets.create=true` and pass secrets via `--set` or a values file (not recommended for production).


