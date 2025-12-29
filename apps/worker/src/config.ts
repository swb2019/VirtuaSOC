export type WorkerConfig = {
  redisUrl: string;
  controlDatabaseUrl: string;
  tenantDsnEncryptionKey: string;
  tenantSlugs?: string[];
  rssFeedUrls: string[];
};

export function getWorkerConfig(): WorkerConfig {
  const redisUrl = process.env.REDIS_URL ?? "";
  if (!redisUrl) throw new Error("REDIS_URL is required");

  const controlDatabaseUrl = process.env.CONTROL_DATABASE_URL ?? "";
  if (!controlDatabaseUrl) throw new Error("CONTROL_DATABASE_URL is required");

  const tenantDsnEncryptionKey = process.env.TENANT_DSN_ENCRYPTION_KEY ?? "";
  if (!tenantDsnEncryptionKey) throw new Error("TENANT_DSN_ENCRYPTION_KEY is required");

  const tenantSlugsRaw = (process.env.TENANT_SLUGS ?? "").trim();
  const tenantSlugs = tenantSlugsRaw
    ? tenantSlugsRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : undefined;

  const rssFeedUrls = (process.env.RSS_FEED_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { redisUrl, controlDatabaseUrl, tenantDsnEncryptionKey, tenantSlugs, rssFeedUrls };
}
