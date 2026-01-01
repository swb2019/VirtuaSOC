import { env, requireEnv } from "../env";

import { PrismaClient } from "../generated/control";

const globalForPrisma = globalThis as unknown as { prismaControl?: PrismaClient };

export function prismaControl(): PrismaClient {
  const existing = globalForPrisma.prismaControl;
  if (existing) return existing;

  const client = new PrismaClient({
    datasources: {
      db: {
        url: requireEnv("CONTROL_DATABASE_URL", env.controlDatabaseUrl),
      },
    },
  });

  if (env.nodeEnv !== "production") globalForPrisma.prismaControl = client;
  return client;
}


