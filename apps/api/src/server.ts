import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";

import { createDb } from "./db.js";
import { getConfig, type ApiConfig } from "./config.js";
import { adminTenantsRoutes } from "./routes/adminTenants.js";
import { tenancyPlugin } from "./tenancy/plugin.js";
import { tenantHealthRoutes } from "./routes/tenantHealth.js";

declare module "fastify" {
  interface FastifyInstance {
    config: ApiConfig;
    controlDb: ReturnType<typeof createDb>;
  }
}

export async function createApp() {
  const config = getConfig();
  const app = Fastify({ logger: true });

  app.decorate("config", config);
  app.decorate("controlDb", createDb(config.controlDatabaseUrl));

  await app.register(cors, { origin: true });
  await app.register(sensible);

  if (config.authMode === "local") {
    await app.register(jwt, { secret: config.jwtSecret! });
  }

  await app.register(swagger, {
    openapi: {
      info: { title: "VirtuaSOC API", version: "0.1.0" },
    },
  });

  const basePath = config.apiBasePath?.trim() || "/api";
  await app.register(swaggerUi, { routePrefix: `${basePath}/docs` });

  app.get(`${basePath}/health`, async () => ({ ok: true }));
  await app.register(adminTenantsRoutes, { prefix: basePath });
  await app.register(async (tenantScoped) => {
    await tenantScoped.register(tenancyPlugin);
    await tenantScoped.register(tenantHealthRoutes);
  }, { prefix: basePath });

  return app;
}


