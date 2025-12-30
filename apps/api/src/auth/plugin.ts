import type { FastifyPluginAsync } from "fastify";

import { getTenantAuthProvider } from "../tenancy/controlPlane.js";
import { verifyOidcAccessToken, type OidcAuthUser } from "./oidc.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: OidcAuthUser;
  }
}

type LocalAuthUser = {
  sub: string;
  role: "viewer" | "gsoc_analyst" | "gsoc_lead" | "admin";
};

function isRole(value: unknown): value is LocalAuthUser["role"] {
  return value === "viewer" || value === "gsoc_analyst" || value === "gsoc_lead" || value === "admin";
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    if (app.config.authMode === "local") {
      const authz = String(req.headers.authorization ?? "");
      if (!authz.startsWith("Bearer ")) return reply.code(401).send({ error: "Missing bearer token" });
      const token = authz.slice("Bearer ".length).trim();
      if (!token) return reply.code(401).send({ error: "Missing bearer token" });

      try {
        // fastify-jwt decorates the request in AUTH_MODE=local.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = (await (req as any).jwtVerify()) as any;

        const sub = String(payload?.sub ?? "");
        const roleRaw = payload?.role;
        const role = isRole(roleRaw) ? roleRaw : "viewer";
        if (!sub) return reply.code(401).send({ error: "Invalid token" });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).authUser = { sub, role } satisfies LocalAuthUser;
        return;
      } catch (err) {
        req.log.warn({ err }, "Local JWT verification failed");
        return reply.code(401).send({ error: "Invalid token" });
      }
    }

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


