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
