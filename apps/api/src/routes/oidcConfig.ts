import type { FastifyPluginAsync } from "fastify";

import { getTenantAuthProvider } from "../tenancy/controlPlane.js";

export const oidcConfigRoutes: FastifyPluginAsync = async (app) => {
  app.get("/auth/oidc/config", async (req, reply) => {
    if (!req.tenant) return reply.code(500).send({ error: "Tenant context missing" });
    const provider = await getTenantAuthProvider(app.controlDb, req.tenant.id);
    if (!provider) return reply.code(404).send({ error: "OIDC not configured for tenant" });

    return {
      issuer: provider.issuer,
      clientId: provider.clientId,
      scopes: provider.scopes,
      roleClaimPath: provider.roleClaimPath,
    };
  });
};


