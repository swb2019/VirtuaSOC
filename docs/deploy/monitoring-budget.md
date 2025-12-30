# Monitoring + alerting (budget mode)

This is the lowest-effort monitoring setup that catches real outages without adding expensive infrastructure.

## 1) Uptime checks (most important)

Create two **Cloud Monitoring Uptime Checks**:
- `GET https://app.virtuasoc.com/`
- `GET https://app.virtuasoc.com/api/health`

Alerting policy:
- trigger after 2–3 consecutive failures
- notify via email/SMS (whatever you’ll actually see)

## 2) VM resource alerts

Create alerting policies on the GCE VM:
- CPU utilization (sustained high CPU can cause latency)
- Disk utilization (running out of disk will break Postgres)
- Memory utilization (if you install the Ops Agent, you can alert on memory)

Recommended thresholds (starting point):
- CPU > 80% for 10–15 minutes
- Disk free < 15% (or < 10GB)

## 3) Logs: find errors quickly

Use Cloud Logging:
- Look at API logs for repeated 401/403/5xx.
- Track “Server is under pressure” 503s (from `@fastify/under-pressure`) — this indicates VM sizing/pressure.

Optional: create a log-based metric:
- count of `status=503` or messages containing “under pressure”
- alert if it spikes

## 4) Backups + restore drills (reliability)

Make sure both are configured and tested:
- Disk snapshots: `docs/deploy/backups-snapshots.md`
- Nightly pg_dump to GCS: `docs/deploy/backups-pgdump.md`

At least once, do a **practice restore** to verify the procedure works.


