import { createHash } from "node:crypto";

import { Queue, Worker } from "bullmq";

import { getWorkerConfig } from "./config.js";
import { createDb, type Db } from "./db.js";
import { ingestRssFeed, type IngestRssJobPayload } from "./ingest/rss.js";
import { runRetentionCleanup, type RetentionCleanupJobPayload } from "./maintenance/retentionCleanup.js";
import { JOBS, QUEUES } from "./queues.js";
import { getTenantDbDsn, listTenants } from "./tenancy/controlPlane.js";
import { runAutoSitrep, type AutoSitrepJobPayload } from "./reports/autoSitrep.js";

const DEFAULT_RSS_FEEDS = [
  "https://www.cisa.gov/uscert/ncas/alerts.xml",
  "https://www.cisa.gov/uscert/ncas/current-activity.xml",
] as const;

const config = getWorkerConfig();
const controlDb = createDb(config.controlDatabaseUrl);
const connection = { url: config.redisUrl };

function hashId(text: string) {
  return createHash("sha1").update(text).digest("hex");
}

const tenantDbCache = new Map<string, Db>();

async function tenantDbFor(tenantId: string): Promise<Db> {
  const cached = tenantDbCache.get(tenantId);
  if (cached) return cached;
  const dsn = await getTenantDbDsn(controlDb, tenantId, config.tenantDsnEncryptionKey);
  const db = createDb(dsn);
  tenantDbCache.set(tenantId, db);
  return db;
}

async function scheduleTenantJobs(tenantId: string) {
  const ingestQueue = new Queue(QUEUES.ingest, { connection });

  const feeds = config.rssFeedUrls.length ? config.rssFeedUrls : [...DEFAULT_RSS_FEEDS];
  for (const feedUrl of feeds) {
    const payload: IngestRssJobPayload = { tenantId, feedUrl };
    await ingestQueue.add(JOBS.ingestRss, payload, {
      repeat: { every: 15 * 60 * 1000 },
      jobId: `rss:${tenantId}:${hashId(feedUrl)}`,
    });
  }

  const days = Number(process.env.DATA_RETENTION_DAYS ?? "90");
  const cleanupPayload: RetentionCleanupJobPayload = {
    tenantId,
    days: Number.isFinite(days) ? days : 90,
  };
  await ingestQueue.add(JOBS.retentionCleanup, cleanupPayload, {
    repeat: { every: 24 * 60 * 60 * 1000 },
    jobId: `cleanup:${tenantId}`,
  });

  const sitrepPayload: AutoSitrepJobPayload = { tenantId };
  await ingestQueue.add(JOBS.autoSitrep, sitrepPayload, {
    repeat: { every: 24 * 60 * 60 * 1000 },
    jobId: `autos:sitrep:${tenantId}`,
  });
}

async function main() {
  const tenants = (await listTenants(controlDb)).filter((t) =>
    config.tenantSlugs?.length ? config.tenantSlugs.includes(t.slug) : true,
  );
  if (!tenants.length) throw new Error("No tenants found in control-plane DB.");

  for (const t of tenants) {
    await scheduleTenantJobs(t.id);
  }

  // Ingest worker
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  new Worker(
    QUEUES.ingest,
    async (job) => {
      if (job.name === JOBS.ingestRss) {
        const payload = job.data as IngestRssJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await ingestRssFeed(tenantDb, payload);
        return;
      }
      if (job.name === JOBS.retentionCleanup) {
        const payload = job.data as RetentionCleanupJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await runRetentionCleanup(tenantDb, payload);
        return;
      }
      if (job.name === JOBS.autoSitrep) {
        const payload = job.data as AutoSitrepJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await runAutoSitrep(tenantDb, payload);
        return;
      }
    },
    { connection },
  );

  // eslint-disable-next-line no-console
  console.log("[worker] started");
}

await main();
