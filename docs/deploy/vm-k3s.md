# Single-VM deployment (GCE + k3s + Helm) — budget mode

This is the **<$100/mo** deployment path: a single Google Compute Engine VM running **k3s** (Kubernetes) + **Helm**.

It replaces:
- GKE (cluster fee + node pool)
- Cloud SQL
- Memorystore Redis

with:
- 1 VM (Compute Engine)
- Postgres + Redis running **inside k3s** (PVC-backed Postgres; Redis ephemeral)

## 0) Assumptions
- GCP project: `virtuasoc`
- Region/zone: `us-east1` / `us-east1-b`
- Domain: `app.virtuasoc.com` (tenant selection via `X-Tenant-Slug` for now)

## 1) Create VM + firewall (example)
Pick a VM size that can run Postgres + Redis + 3 app pods:
- Recommended: **`e2-medium`** (2 vCPU, 4GB RAM)

Create firewall rule (SSH + HTTP/HTTPS):

```bash
gcloud compute firewall-rules create virtuasoc-web \
  --project virtuasoc \
  --network default \
  --direction INGRESS \
  --priority 1000 \
  --target-tags virtuasoc-web \
  --allow "tcp:22,tcp:80,tcp:443"
```

Create the VM (Ubuntu 22.04, 50GB disk) and install k3s + Helm via startup script:

```bash
gcloud compute instances create virtuasoc-vm \
  --project virtuasoc \
  --zone us-east1-b \
  --machine-type e2-medium \
  --boot-disk-size 50GB \
  --boot-disk-type pd-standard \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --tags virtuasoc-web \
  --metadata-from-file startup-script=infra/gcp/vm-k3s/startup.sh
```

Verify k3s is up:

```bash
gcloud compute ssh virtuasoc-vm --project virtuasoc --zone us-east1-b --command \
  "sudo /usr/local/bin/k3s kubectl get nodes -o wide"
```

## 2) Install dependencies in k3s (ingress + cert-manager + postgres + redis)
SSH to the VM and run:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.replicaCount=1

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true

kubectl create namespace virtuasoc || true
```

Postgres (PVC-backed) + Redis (ephemeral):

```bash
# Pick a password and keep it safe
export POSTGRES_PASSWORD="REPLACE_ME"

helm upgrade --install virtuasoc-postgres bitnami/postgresql \
  --namespace virtuasoc \
  --set architecture=standalone \
  --set auth.username=postgres \
  --set auth.postgresPassword="$POSTGRES_PASSWORD" \
  --set auth.database=virtuasoc_control \
  --set primary.persistence.size=20Gi

helm upgrade --install virtuasoc-redis bitnami/redis \
  --namespace virtuasoc \
  --set architecture=standalone \
  --set auth.enabled=false \
  --set master.persistence.enabled=false
```

## 3) Create app secrets (Kubernetes Secret)
Create a secret named `virtuasoc-secrets` in `virtuasoc` namespace.

Required keys:
- `REDIS_URL` (e.g. `redis://virtuasoc-redis-master:6379`)
- `CONTROL_DATABASE_URL` (points at `virtuasoc_control`)
- `POSTGRES_ADMIN_URL` (points at `postgres`)
- `TENANT_DSN_ENCRYPTION_KEY` (32 bytes hex or base64)
- `PLATFORM_ADMIN_KEY` (random string; used for `/api/admin/*`)
- `JWT_SECRET` (for `AUTH_MODE=local`)

### Optional: Infisical (recommended for secret hygiene)
If you use **Infisical**, configure it to write a Kubernetes Secret named `virtuasoc-secrets` in the `virtuasoc` namespace.

Then keep the chart set to:
- `secrets.create=false`
- `secrets.existingSecretName=virtuasoc-secrets`

## 4) Deploy VirtuaSOC Helm chart
Use `infra/gcp/values.k3s.yaml` as a starting point.

```bash
helm upgrade --install virtuasoc infra/k8s/helm/virtuasoc \
  --namespace virtuasoc \
  -f infra/gcp/values.k3s.yaml
```

## 5) HTTPS for `app.virtuasoc.com` (Let’s Encrypt HTTP-01)
Apply the ClusterIssuer + Certificate:

```bash
kubectl apply -f infra/k8s/cert-manager/http01/clusterissuer-letsencrypt-http01.yaml
kubectl apply -f infra/k8s/cert-manager/http01/certificate-app-virtuasoc.yaml
```

Wait until Ready:

```bash
kubectl -n virtuasoc get certificate virtuasoc-app -o wide
```

## 6) Create first tenant
Use the platform admin key:

```bash
curl -X POST https://app.virtuasoc.com/api/admin/tenants \
  -H "content-type: application/json" \
  -H "x-platform-admin-key: <PLATFORM_ADMIN_KEY>" \
  -d '{ "slug": "demo", "name": "Demo" }'
```

## 7) Login (no enterprise OIDC yet)
VirtuaSOC includes a **Local admin (break-glass)** login in the web UI when `AUTH_MODE=local`:
- Go to `https://app.virtuasoc.com`
- Click **Local admin (break-glass)**
- Paste the `PLATFORM_ADMIN_KEY`

When you later configure enterprise OIDC, switch `env.authMode` back to `oidc`.


