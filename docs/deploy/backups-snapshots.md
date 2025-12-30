# VM disk snapshots (GCE) — VirtuaSOC budget mode

This runbook configures **daily scheduled snapshots** for the `virtuasoc-vm` persistent disk(s).

Why this matters:
- **Fast full restore** (bring the entire VM back quickly)
- **Low/no downtime** for the running service (snapshots are taken while the VM is online)

This is intentionally paired with the **nightly `pg_dump` → GCS** backup (see `docs/deploy/backups-pgdump.md`) for best recoverability.

## 1) Find the VM disks

```bash
gcloud compute instances describe virtuasoc-vm \
  --project virtuasoc \
  --zone us-east1-b \
  --format="table(disks[].deviceName,disks[].boot,disks[].source)"
```

Extract the disk name(s) from the `source` path (last path segment).

## 2) Create a daily snapshot schedule

Create a snapshot schedule resource policy in region `us-east1`:

```bash
gcloud compute resource-policies create snapshot-schedule virtuasoc-daily-snapshots \
  --project virtuasoc \
  --region us-east1 \
  --description="VirtuaSOC daily disk snapshots (budget mode)" \
  --start-time 03:00 \
  --daily-schedule \
  --max-retention-days 14
```

## 3) Attach the schedule to the disk(s)

For each disk name you found above (example uses `virtuasoc-vm`):

```bash
gcloud compute disks add-resource-policies virtuasoc-vm \
  --project virtuasoc \
  --zone us-east1-b \
  --resource-policies virtuasoc-daily-snapshots
```

Verify attachment:

```bash
gcloud compute disks describe virtuasoc-vm \
  --project virtuasoc \
  --zone us-east1-b \
  --format="get(resourcePolicies)"
```

## 4) Verify snapshots are being created

```bash
gcloud compute snapshots list \
  --project virtuasoc \
  --filter="name~'^auto-.*virtuasoc.*' OR name~'virtuasoc'" \
  --sort-by="~creationTimestamp" \
  --limit=20 \
  --format="table(name,sourceDisk,creationTimestamp,status,storageBytes)"
```

## 5) Restore procedure (high-level)

You typically restore by creating a new disk from a snapshot, then creating/replacing the VM:

1. Pick the snapshot you want to restore from.
2. Create a new disk from that snapshot.
3. Create a new VM using that disk (or stop/delete the existing VM and re-create, depending on your recovery approach).
4. Re-attach the existing **static external IP** (preferred) or update DNS if you must change IP.
5. Verify:
   - `https://app.virtuasoc.com/`
   - `https://app.virtuasoc.com/api/health`

## Notes on consistency

- Snapshots are generally **crash-consistent**. PostgreSQL is designed to recover from crash-consistent disks via WAL replay.
- For “oops” recovery and portable restores, use the **nightly `pg_dump` → GCS** backups as well.


