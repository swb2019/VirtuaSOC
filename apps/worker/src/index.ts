import { createHash } from "node:crypto";

import { Queue, Worker } from "bullmq";

import { getWorkerConfig } from "./config.js";
import { createDb, type Db } from "./db.js";
import { ingestRssFeed, type IngestRssJobPayload } from "./ingest/rss.js";
import { runRetentionCleanup, type RetentionCleanupJobPayload } from "./maintenance/retentionCleanup.js";
import { JOBS, QUEUES } from "./queues.js";
import { evaluateSignal, type EvaluateSignalJobPayload } from "./signals/evaluateSignal.js";
import { getTenantDbDsn, listTenants } from "./tenancy/controlPlane.js";
import { runAutoSitrep, type AutoSitrepJobPayload } from "./reports/autoSitrep.js";
import { distributeReport, type DistributeReportJobPayload } from "./reports/distributeReport.js";
import { generateProduct, type GenerateProductJobPayload } from "./products/generateProduct.js";
import { distributeProduct, type DistributeProductJobPayload } from "./products/distributeProduct.js";

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

const ingestQueue = new Queue(QUEUES.ingest, { connection });

const scheduledOneTime = new Set<string>();
const scheduledRss = new Set<string>();

async function rssFeedUrlsForTenant(tenantId: string): Promise<string[]> {
  const tenantDb = await tenantDbFor(tenantId);
  try {
    const rows = await tenantDb<{ url: string }[]>`
      SELECT url
      FROM rss_feeds
      WHERE tenant_id = ${tenantId} AND enabled = true
      ORDER BY created_at DESC
    `;
    const urls = rows.map((r) => String(r.url ?? "").trim()).filter(Boolean);
    if (urls.length) return urls;
  } catch (err) {
    // Table may not exist yet on older tenant DBs (until migrations have been applied).
    // eslint-disable-next-line no-console
    console.warn("[worker] rss_feeds query failed; falling back to defaults", err);
  }

  return config.rssFeedUrls.length ? config.rssFeedUrls : [...DEFAULT_RSS_FEEDS];
}

async function scheduleTenantJobs(tenantId: string) {
  const feeds = await rssFeedUrlsForTenant(tenantId);
  for (const feedUrl of feeds) {
    const payload: IngestRssJobPayload = { tenantId, feedUrl };
    const jobId = `rss:${tenantId}:${hashId(feedUrl)}`;
    if (scheduledRss.has(jobId)) continue;
    await ingestQueue.add(JOBS.ingestRss, payload, {
      repeat: { every: 15 * 60 * 1000 },
      jobId,
    });
    scheduledRss.add(jobId);
  }

  if (scheduledOneTime.has(tenantId)) return;

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

  scheduledOneTime.add(tenantId);
}

async function main() {
  async function refreshTenants() {
    const tenants = (await listTenants(controlDb)).filter((t) =>
      config.tenantSlugs?.length ? config.tenantSlugs.includes(t.slug) : true,
    );
    if (!tenants.length) {
      // eslint-disable-next-line no-console
      console.log("[worker] no tenants yet; waiting…");
      return;
    }
    for (const t of tenants) {
      await scheduleTenantJobs(t.id);
      // eslint-disable-next-line no-console
      console.log(`[worker] ensured scheduled jobs for tenant ${t.slug} (${t.id})`);
    }
  }

  await refreshTenants();
  setInterval(() => {
    refreshTenants().catch((err) => console.error("[worker] refreshTenants error", err));
  }, 5 * 60 * 1000);

  // Ingest worker
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  new Worker(
    QUEUES.ingest,
    async (job) => {
      if (job.name === JOBS.ingestRss) {
        const payload = job.data as IngestRssJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        const inserted = await ingestRssFeed(tenantDb, payload);
        // Trigger signal evaluation for newly inserted evidence.
        for (const evidenceId of inserted) {
          await ingestQueue.add(
            JOBS.evaluateSignal,
            { tenantId: payload.tenantId, evidenceId } satisfies EvaluateSignalJobPayload,
            { jobId: `sig:${payload.tenantId}:${evidenceId}`, removeOnComplete: 1000, removeOnFail: 1000 },
          );
        }
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
      if (job.name === JOBS.distributeReport) {
        const payload = job.data as DistributeReportJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await distributeReport(tenantDb, payload);
        return;
      }
      if (job.name === JOBS.evaluateSignal) {
        const payload = job.data as EvaluateSignalJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await evaluateSignal(tenantDb, payload);
        return;
      }
      if (job.name === JOBS.generateProduct) {
        const payload = job.data as GenerateProductJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await generateProduct(tenantDb, payload);
        return;
      }
      if (job.name === JOBS.distributeProduct) {
        const payload = job.data as DistributeProductJobPayload;
        const tenantDb = await tenantDbFor(payload.tenantId);
        await distributeProduct(tenantDb, payload);
        return;
      }
    },
    { connection },
  );

  // eslint-disable-next-line no-console
  console.log("[worker] started");
}

await main();
