# GCP (GKE + Cloud SQL + Memorystore) — economical Dev/PoC

This is a lightweight runbook to deploy VirtuaSOC to GKE with managed Postgres (Cloud SQL) and managed Redis (Memorystore).

## Prereqs (local)
- Install Google Cloud CLI (`gcloud`)
- Install Helm (`helm`)
- `kubectl` is already required

## High-level steps
1) Create / select GCP project + enable APIs
2) Create GKE cluster (single-zone for Dev/PoC)
3) Create Cloud SQL Postgres instance + control-plane DB
4) Create Memorystore Redis instance
5) Configure Workload Identity + Cloud SQL Auth Proxy sidecars
6) Deploy with Helm (`infra/k8s/helm/virtuasoc`)
7) Onboard first tenant via `/api/admin/tenants`

See `docs/deploy/gke.md` for Helm value examples.


