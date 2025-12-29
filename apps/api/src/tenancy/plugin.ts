import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import { createDb, type Db } from "../db.js";
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

  // tenantSlug.example.com -> tenantSlug
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0] ?? null;

  return null;
}

export const tenancyPlugin: FastifyPluginAsync = async (app) => {
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
      tenantDb = createDb(dsn);
      cache.set(tenant.id, tenantDb);
    }

    req.tenant = tenant;
    req.tenantDb = tenantDb;
  });
};


