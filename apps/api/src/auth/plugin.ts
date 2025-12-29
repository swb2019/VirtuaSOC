import type { FastifyPluginAsync } from "fastify";

import { getTenantAuthProvider } from "../tenancy/controlPlane.js";
import { verifyOidcAccessToken, type OidcAuthUser } from "./oidc.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: OidcAuthUser;
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    if (app.config.authMode !== "oidc") return;
    if (!req.tenant) return reply.code(500).send({ error: "Tenant context missing" });

    const authz = String(req.headers.authorization ?? "");
    if (!authz.startsWith("Bearer ")) return reply.code(401).send({ error: "Missing bearer token" });
    const token = authz.slice("Bearer ".length).trim();
    if (!token) return reply.code(401).send({ error: "Missing bearer token" });

    const provider = await getTenantAuthProvider(app.controlDb, req.tenant.id);
    if (!provider) return reply.code(501).send({ error: "OIDC not configured for tenant" });

    try {
      req.authUser = await verifyOidcAccessToken(token, provider);
    } catch (err) {
      req.log.warn({ err }, "OIDC token verification failed");
      return reply.code(401).send({ error: "Invalid token" });
    }
  });
};


