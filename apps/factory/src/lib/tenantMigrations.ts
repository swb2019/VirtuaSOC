import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

import { runSqlMigrations } from "./sqlMigrations";

const migrated = new Map<string, Promise<void>>();

function dsnKey(dsn: string): string {
  return createHash("sha1").update(dsn).digest("hex");
}

function resolveTenantMigrationsDir(): string {
  // In production containers, cwd is typically /repo/apps/factory.
  const candidates = [
    resolve(process.cwd(), "../api/migrations-tenant"),
    resolve(process.cwd(), "../../apps/api/migrations-tenant"),
    resolve(process.cwd(), "apps/api/migrations-tenant"),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    `Tenant migrations directory not found. Looked in: ${candidates.join(", ")}. ` +
      `Ensure apps/api/migrations-tenant is present in the Factory runtime image.`,
  );
}

export async function ensureTenantDbMigrated(dsn: string): Promise<void> {
  if ((process.env.AUTO_MIGRATE_TENANT ?? "true") === "false") return;

  const url = dsn.trim();
  if (!url) return;

  const key = dsnKey(url);
  const existing = migrated.get(key);
  if (existing) return existing;

  const p = runSqlMigrations(url, resolveTenantMigrationsDir()).catch((err) => {
    migrated.delete(key);
    throw err;
  });
  migrated.set(key, p);
  return p;
}


