import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { resolve } from "node:path";

import { createDb, type Db } from "../db.js";
import { runSqlMigrations } from "../migrations/migrator.js";
import { getTenantBySlug, getTenantDbDsn, type TenantRecord } from "./controlPlane.js";

declare module "fastify" {
  interface FastifyRequest {
    tenant?: TenantRecord;
    tenantDb?: Db;
  }
}

function resolveTenantSlug(req: FastifyRequest): string | null {
  const headerSlug = req.headers["x-tenant-slug"];
  if (typeof headerSlug === "string" && headerSlug.trim()) return headerSlug.trim().toLowerCase();

  const host = String(req.headers.host ?? "").split(":")[0]?.toLowerCase();
  if (!host) return null;

  const parts = host.split(".").filter(Boolean);

  // Exclude raw IPv4 hostnames like 34.12.56.78
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) return null;

  // Handle nip.io: 34.12.56.78.nip.io (no tenant) vs tenant.34.12.56.78.nip.io
  const isNip = parts.slice(-2).join(".") === "nip.io";
  if (isNip && parts.length === 6 && parts.slice(0, 4).every((p) => /^\d+$/.test(p))) return null;

  // app.example.com is the base host (not a tenant); tenants are tenant.app.example.com
  if (parts.length === 3 && parts[0] === "app") return null;

  // tenantSlug.example.com -> tenantSlug (legacy) OR tenantSlug.app.example.com -> tenantSlug
  if (parts.length >= 3) {
    const candidate = parts[0] ?? null;
    if (!candidate) return null;
    if (candidate === "app" || candidate === "www") return null;
    return candidate;
  }

  return null;
}

export const tenancyPlugin: FastifyPluginAsync = fp(async (app) => {
  const cache = new Map<string, Db>();

  app.addHook("onRequest", async (req, reply) => {
    const slug = resolveTenantSlug(req);
    if (!slug) return reply.code(400).send({ error: "Tenant not specified (use subdomain or X-Tenant-Slug)" });

    const tenant = await getTenantBySlug(app.controlDb, slug);
    if (!tenant) return reply.code(404).send({ error: "Unknown tenant" });

    if (!app.config.tenantDsnEncryptionKey) {
      return reply.code(500).send({ error: "TENANT_DSN_ENCRYPTION_KEY not configured" });
    }

    let tenantDb = cache.get(tenant.id);
    if (!tenantDb) {
      const dsn = await getTenantDbDsn(app.controlDb, tenant.id, app.config.tenantDsnEncryptionKey);

      // Economical default: keep tenant DB schema up to date automatically (safe for our single-replica budget mode).
      if ((process.env.AUTO_MIGRATE_TENANT ?? "true") !== "false") {
        const dir = resolve(process.cwd(), "apps/api/migrations-tenant");
        await runSqlMigrations(dsn, dir);
      }

      tenantDb = createDb(dsn);
      cache.set(tenant.id, tenantDb);
    }

    req.tenant = tenant;
    req.tenantDb = tenantDb;
  });
});


