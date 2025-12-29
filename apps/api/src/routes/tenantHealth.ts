import type { FastifyPluginAsync } from "fastify";

export const tenantHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/tenant/health", async (req, reply) => {
    if (!req.tenant || !req.tenantDb) return reply.code(500).send({ error: "Tenant context missing" });
    await req.tenantDb`SELECT 1 as ok`;
    return { ok: true, tenant: req.tenant.slug };
  });
};


