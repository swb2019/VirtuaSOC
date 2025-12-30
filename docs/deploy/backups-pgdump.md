# Nightly Postgres logical backups (`pg_dump`) → GCS — VirtuaSOC budget mode

This runbook adds a **nightly CronJob in Kubernetes** that:
- connects to Postgres using `POSTGRES_ADMIN_URL` (from `virtuasoc-secrets`)
- enumerates all non-template databases (control + tenant DBs)
- `pg_dump`s each DB and uploads to a private **GCS bucket**

Why this matters:
- **Low/no downtime** (no maintenance window needed)
- Best “oops” recovery (restore a single database without restoring the whole VM)

## 0) Prereqs
- You are running VirtuaSOC on the single VM k3s cluster (`docs/deploy/vm-k3s.md`)
- `POSTGRES_ADMIN_URL` exists in the `virtuasoc-secrets` Secret (managed by Infisical)
- You can run `gcloud`/`gsutil` with permission to create:
  - a GCS bucket
  - a service account + key

## 1) Create a GCS bucket (regional + lifecycle)

Pick a globally-unique bucket name (example):
- `virtuasoc-backups-<YOUR_UNIQUE_SUFFIX>`

Create the bucket in `us-east1`:

```bash
export BUCKET="virtuasoc-backups-REPLACE_ME"

gsutil mb -p virtuasoc -l us-east1 -b on "gs://${BUCKET}"
```

Add a lifecycle policy (delete after 30 days):

Create `lifecycle.json`:

```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": 30 }
    }
  ]
}
```

Apply it:

```bash
gsutil lifecycle set lifecycle.json "gs://${BUCKET}"
```

## 2) Create a backup service account (least privilege)

Create a service account:

```bash
gcloud iam service-accounts create virtuasoc-backup \
  --project virtuasoc \
  --display-name="VirtuaSOC Postgres backups (pg_dump → GCS)"
```

Grant bucket write permission (upload-only):

```bash
gsutil iam ch \
  "serviceAccount:virtuasoc-backup@virtuasoc.iam.gserviceaccount.com:objectCreator" \
  "gs://${BUCKET}"
```

Create a key file:

```bash
gcloud iam service-accounts keys create virtuasoc-backup-key.json \
  --project virtuasoc \
  --iam-account virtuasoc-backup@virtuasoc.iam.gserviceaccount.com
```

## 3) Store the SA key JSON in Infisical and sync to Kubernetes

### 3.1 Store in Infisical
In Infisical Cloud, create a secret under a folder/path (recommended): `/backups`

Key:
- `GCP_SA_KEY_JSON`

Value:
- paste the full contents of `virtuasoc-backup-key.json`

### 3.2 Sync to k3s via the Infisical operator
Apply the CR template (edit the placeholders):

```bash
kubectl apply -f infra/k8s/backups/infisicalsecret-backup-gcp-sa.yaml
```

Verify the Kubernetes Secret exists:

```bash
kubectl -n virtuasoc get secret virtuasoc-backup-gcp-sa -o yaml
```

## 4) Install the nightly backup CronJob

1) Edit the CronJob manifest and set:
- `GCS_BUCKET` to your bucket name

File:
- `infra/k8s/backups/pgdump-to-gcs-cronjob.yaml`

2) Apply:

```bash
kubectl apply -f infra/k8s/backups/pgdump-to-gcs-cronjob.yaml
```

## 5) Verify backups

Force-run once by creating a Job from the CronJob:

```bash
kubectl -n virtuasoc create job --from=cronjob/virtuasoc-pgdump-to-gcs virtuasoc-pgdump-manual
kubectl -n virtuasoc logs -f job/virtuasoc-pgdump-manual
```

Confirm objects exist in GCS:

```bash
gsutil ls "gs://${BUCKET}/pgdump/"
```

## 6) Restore (scratch restore example)

The job creates files like:
- `gs://<bucket>/pgdump/<timestamp>/<db>.sql.gz`

To restore a DB to a scratch database:
1) create the destination DB (and user if needed)
2) download and restore:

```bash
gsutil cp "gs://${BUCKET}/pgdump/<timestamp>/<db>.sql.gz" .
gunzip -c "<db>.sql.gz" | psql "<POSTGRES_ADMIN_URL with /<db> as the database>"
```

Notes:
- These dumps are created with `--no-owner --no-privileges` to keep restores simple.
- If you need role ownership/privileges preserved, remove those flags in the CronJob.


