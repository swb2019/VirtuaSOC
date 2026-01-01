import { PrismaClient } from "../generated/tenant";

const cache = new Map<string, PrismaClient>();

export function tenantDb(url: string): PrismaClient {
  const u = url.trim();
  if (!u) throw new Error("tenant DB url is empty");

  const cached = cache.get(u);
  if (cached) return cached;

  const client = new PrismaClient({
    datasources: {
      db: { url: u },
    },
  });
  cache.set(u, client);
  return client;
}


