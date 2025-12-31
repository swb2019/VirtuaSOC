import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import underPressure from "@fastify/under-pressure";
import jwt from "@fastify/jwt";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createDb } from "./db.js";
import { getConfig, type ApiConfig } from "./config.js";
import { adminTenantsRoutes } from "./routes/adminTenants.js";
import { adminAuditRoutes } from "./routes/adminAudit.js";
import { tenancyPlugin } from "./tenancy/plugin.js";
import { tenantHealthRoutes } from "./routes/tenantHealth.js";
import { oidcConfigRoutes } from "./routes/oidcConfig.js";
import { authPlugin } from "./auth/plugin.js";
import { reportDefinitionsRoutes } from "./routes/reportDefinitions.js";
import { evidenceRoutes } from "./routes/evidence.js";
import { ingestWebhookRoutes } from "./routes/ingestWebhook.js";
import { rssFeedsRoutes } from "./routes/rssFeeds.js";
import { reportsRoutes } from "./routes/reports.js";
import { assistantRoutes } from "./routes/assistant.js";
import { adminAssistantRoutes } from "./routes/adminAssistant.js";
import { runSqlMigrations } from "./migrations/migrator.js";

declare module "fastify" {
  interface FastifyInstance {
    config: ApiConfig;
    controlDb: ReturnType<typeof createDb>;
  }
}

export async function createApp() {
  const config = getConfig();
  const app = Fastify({
    logger: true,
    genReqId: (req) => {
      const provided = req.headers["x-request-id"];
      if (typeof provided === "string" && provided.trim()) return provided.trim();
      return randomUUID();
    },
  });

  app.decorate("config", config);
  app.decorate("controlDb", createDb(config.controlDatabaseUrl));

  // Economical + simple: auto-migrate control-plane on startup (safe for our default replicaCount=1).
  if ((process.env.AUTO_MIGRATE_CONTROL ?? "true") !== "false") {
    const dir = resolve(process.cwd(), "apps/api/migrations-control");
    await runSqlMigrations(config.controlDatabaseUrl, dir);
  }

  await app.register(cors, { origin: true });
  await app.register(sensible);

  // Budget-safe reliability protections
  await app.register(underPressure, {
    // If the event loop is consistently blocked, return 503s instead of piling on.
    maxEventLoopDelay: 1000,
    message: "Server is under pressure",
  });

  // Lightweight rate limiting (in-memory; fine for our single-replica budget mode).
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });

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
  await app.register(adminAuditRoutes, { prefix: basePath });
  await app.register(adminAssistantRoutes, { prefix: basePath });
  await app.register(async (tenantScoped) => {
    await tenantScoped.register(tenancyPlugin);
    await tenantScoped.register(oidcConfigRoutes);
    await tenantScoped.register(authPlugin);
    await tenantScoped.register(tenantHealthRoutes);
    await tenantScoped.register(reportDefinitionsRoutes);
    await tenantScoped.register(evidenceRoutes);
    await tenantScoped.register(ingestWebhookRoutes);
    await tenantScoped.register(rssFeedsRoutes);
    await tenantScoped.register(reportsRoutes);
    await tenantScoped.register(assistantRoutes);
  }, { prefix: basePath });

  return app;
}


