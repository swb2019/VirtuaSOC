# cert-manager TLS (Let’s Encrypt)

VirtuaSOC uses `ingress-nginx` and supports **wildcard tenant subdomains**:

- `app.virtuasoc.com`
- `*.app.virtuasoc.com`

Wildcard TLS requires **DNS-01**. With Namecheap as registrar/DNS, the simplest automated path is:

1. Delegate `app.virtuasoc.com` to **Cloud DNS** (add NS records in Namecheap for host `app`)
2. Use cert-manager’s **CloudDNS** solver to manage `_acme-challenge.app.virtuasoc.com` TXT records

## Files
- `clusterissuer-letsencrypt-staging.yaml`: staging issuer (safe for testing)
- `clusterissuer-letsencrypt-prod.yaml`: production issuer
- `certificate-virtuasoc-wildcard.yaml`: wildcard certificate request for `app.virtuasoc.com` + `*.app.virtuasoc.com`

## Prereqs
- A Cloud DNS zone for `app.virtuasoc.com.` with A records for:
  - `app.virtuasoc.com` → ingress external IP
  - `*.app.virtuasoc.com` → ingress external IP
- Workload Identity binding for cert-manager (recommended; avoids keys):
  - GCP service account with `roles/dns.admin` on the project
  - Kubernetes service account `cert-manager` annotated with `iam.gke.io/gcp-service-account: <gsa-email>`
  - IAM binding on the GSA for `roles/iam.workloadIdentityUser` to:
    - `serviceAccount:<PROJECT_ID>.svc.id.goog[cert-manager/cert-manager]`

## Apply
Apply the issuers and certificate:

```bash
kubectl apply -f infra/k8s/cert-manager/clusterissuer-letsencrypt-staging.yaml
kubectl apply -f infra/k8s/cert-manager/clusterissuer-letsencrypt-prod.yaml
kubectl apply -f infra/k8s/cert-manager/certificate-virtuasoc-wildcard.yaml
```


