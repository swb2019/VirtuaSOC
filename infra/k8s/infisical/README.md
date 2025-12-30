## Infisical Cloud → Kubernetes Secret sync (VirtuaSOC)

This folder contains **templates** to sync secrets from **Infisical Cloud** into Kubernetes using the **Infisical Secrets Operator**.

VirtuaSOC’s Helm chart is already configured (in budget mode) to read app secrets from an existing Secret named:
- namespace: `virtuasoc`
- secret: `virtuasoc-secrets`

### 1) Install the Infisical Secrets Operator

On the k3s VM (or any machine with `kubectl`/`helm` pointing at the k3s cluster):

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

helm repo add infisical https://dl.cloudsmith.io/public/infisical/helm-charts/helm/charts/
helm repo update

helm upgrade --install infisical-operator infisical/secrets-operator \
  --namespace infisical-operator-system --create-namespace
```

### 2) Create an Infisical Machine Identity (Universal Auth)

In Infisical Cloud:
- Create a **Machine Identity** with access to your VirtuaSOC project/environment
- Copy the **Client ID** and **Client Secret**

Then apply the template secret (replace placeholders):

```bash
kubectl apply -f infra/k8s/infisical/infisical-auth-secret.yaml
```

### 3) Create the InfisicalSecret CR to sync `virtuasoc-secrets`

Edit `infra/k8s/infisical/infisicalsecret-virtuasoc.yaml`:
- set `projectSlug`
- set `envSlug` (e.g. `prod`)
- optionally set `secretsPath` (default `/`)

Apply it:

```bash
kubectl apply -f infra/k8s/infisical/infisicalsecret-virtuasoc.yaml
```

### 4) Verify

```bash
kubectl -n virtuasoc get infisicalsecret
kubectl -n virtuasoc get secret virtuasoc-secrets -o yaml
```

### Required keys for VirtuaSOC (store these in Infisical)

- `REDIS_URL`
- `CONTROL_DATABASE_URL`
- `POSTGRES_ADMIN_URL`
- `TENANT_DSN_ENCRYPTION_KEY`
- `PLATFORM_ADMIN_KEY`
- `JWT_SECRET`


