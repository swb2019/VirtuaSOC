import type { FastifyPluginAsync } from "fastify";

import { verifyPlatformOidcToken } from "../auth/platformOidc.js";

export const adminAuditRoutes: FastifyPluginAsync = async (app) => {
  const { config, controlDb } = app;

  app.addHook("onRequest", async (req, reply) => {
    // Allow public access to the platform OIDC discovery config endpoint (handled by adminTenantsRoutes).
    // This route is always protected.

    // 1) Break-glass key (server-side)
    const providedKey = String(req.headers["x-platform-admin-key"] ?? "");
    if (config.platformAdminKey && providedKey && providedKey === config.platformAdminKey) {
      return;
    }

    // 2) Platform OIDC (preferred)
    const platformOidcEnabled = Boolean(config.platformOidcIssuer && config.platformOidcAudience);
    if (platformOidcEnabled) {
      const authz = String(req.headers.authorization ?? "");
      if (!authz.startsWith("Bearer ")) return reply.code(401).send({ error: "Missing bearer token" });
      const token = authz.slice("Bearer ".length).trim();
      if (!token) return reply.code(401).send({ error: "Missing bearer token" });

      try {
        const user = await verifyPlatformOidcToken(token, {
          issuer: config.platformOidcIssuer!,
          audience: config.platformOidcAudience,
          roleClaimPath: config.platformOidcRoleClaimPath,
          roleMapping: config.platformOidcRoleMapping,
        });
        if (user.role !== "admin") return reply.code(403).send({ error: "Forbidden" });
        return;
      } catch (err) {
        req.log.warn({ err }, "Platform OIDC token verification failed");
        return reply.code(401).send({ error: "Invalid token" });
      }
    }

    if (!config.platformAdminKey) {
      return reply.code(501).send({ error: "PLATFORM_ADMIN_KEY not configured" });
    }
    return reply.code(401).send({ error: "Unauthorized" });
  });

  app.get("/admin/audit", async (req) => {
    const limit = Math.min(200, Math.max(1, Number((req.query as any)?.limit ?? "100") || 100));
    const offset = Math.max(0, Number((req.query as any)?.offset ?? "0") || 0);

    const rows = await controlDb<
      {
        id: string;
        created_at: string;
        actor_sub: string | null;
        actor_email: string | null;
        action: string;
        target_type: string | null;
        target_id: string | null;
        metadata: Record<string, unknown>;
      }[]
    >`
      SELECT id, created_at, actor_sub, actor_email, action, target_type, target_id, metadata
      FROM platform_audit_log
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return { events: rows, limit, offset, nextOffset: offset + rows.length };
  });
};


