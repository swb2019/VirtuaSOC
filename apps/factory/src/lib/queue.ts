import { Queue } from "bullmq";

import { env, requireEnv } from "@/env";

export const QUEUE_INGEST = "ingest";
export const JOB_SIGNALS_EVALUATE = "signals.evaluate";
export const JOB_PRODUCTS_GENERATE = "products.generate";
export const JOB_PRODUCTS_DISTRIBUTE = "products.distribute";

let ingestQueue: Queue | null = null;

export function getIngestQueue(): Queue {
  if (ingestQueue) return ingestQueue;
  const url = requireEnv("REDIS_URL", env.redisUrl);
  ingestQueue = new Queue(QUEUE_INGEST, { connection: { url } });
  return ingestQueue;
}


