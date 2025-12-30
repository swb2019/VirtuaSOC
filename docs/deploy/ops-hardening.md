# Minimal security + ops hardening (budget mode)

This is the “keep it simple but not reckless” checklist for the single-VM k3s deployment.

## 1) Restrict SSH ingress (do this first)

If your firewall rule currently allows `tcp:22` from the internet, fix it:

### Option A (recommended): SSH only from your public IP

1) Update the existing web rule to **remove port 22** (leave HTTP/HTTPS open):

```bash
gcloud compute firewall-rules update virtuasoc-web \
  --project virtuasoc \
  --allow "tcp:80,tcp:443" \
  --source-ranges "0.0.0.0/0"
```

2) Create a separate SSH rule limited to your IP:

```bash
export MY_IP="REPLACE_ME" # example: 203.0.113.10

gcloud compute firewall-rules create virtuasoc-ssh \
  --project virtuasoc \
  --network default \
  --direction INGRESS \
  --priority 1000 \
  --target-tags virtuasoc-web \
  --source-ranges "${MY_IP}/32" \
  --allow "tcp:22"
```

### Option B: IAP-only SSH (most secure)

If you prefer IAP tunneling, allow SSH only from Google’s IAP range:

```bash
gcloud compute firewall-rules create virtuasoc-iap-ssh \
  --project virtuasoc \
  --network default \
  --direction INGRESS \
  --priority 1000 \
  --target-tags virtuasoc-web \
  --source-ranges "35.235.240.0/20" \
  --allow "tcp:22"
```

Then connect with:

```bash
gcloud compute ssh virtuasoc-vm --project virtuasoc --zone us-east1-b --tunnel-through-iap
```

## 2) Prefer pinned image tags (repeatable deploys)

The GitHub workflow publishes images with both:
- `:latest`
- `:<git-sha>`

For repeatable releases, pin to a SHA:
- edit `infra/gcp/values.k3s.yaml` and set `image.*.tag` to the SHA, and set `imagePullPolicy: IfNotPresent` (optional), or
- pass tags via Helm `--set` at deploy time.

Example:

```bash
export SHA="REPLACE_ME"

helm upgrade --install virtuasoc infra/k8s/helm/virtuasoc \
  --namespace virtuasoc \
  -f infra/gcp/values.k3s.yaml \
  --set image.api.tag="${SHA}" \
  --set image.worker.tag="${SHA}" \
  --set image.web.tag="${SHA}"
```

## 3) Uptime checks (cheap, high value)

Create two uptime checks in **Cloud Monitoring** and alert on failures:
- `GET https://app.virtuasoc.com/`
- `GET https://app.virtuasoc.com/api/health`

Minimum alerting:
- notify on 2–3 consecutive failures
- notify via email/SMS (whatever you’ll actually see)

## 4) Don’t skip backups

Make sure these are configured and tested:
- Disk snapshots: `docs/deploy/backups-snapshots.md`
- Nightly pg_dump to GCS: `docs/deploy/backups-pgdump.md`


