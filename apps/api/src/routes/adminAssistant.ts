import { resolve } from "node:path";

import type { FastifyPluginAsync } from "fastify";

import { createOpenAiClient } from "../ai/openaiClient.js";
import { runAssistantAgent, type AssistantChatMessage } from "../ai/assistantAgent.js";
import { buildSetupAssistantTools } from "../assistant/tools.js";
import { verifyPlatformOidcToken, type PlatformAuthUser } from "../auth/platformOidc.js";
import { createDb, type Db } from "../db.js";
import { runSqlMigrations } from "../migrations/migrator.js";
import { getTenantDbDsn } from "../tenancy/controlPlane.js";

declare module "fastify" {
  interface FastifyRequest {
    platformUser?: PlatformAuthUser;
  }
}

const usage = new Map<string, number>();
const tenantDbCache = new Map<string, Db>();

function dayKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function bumpUsage(tenantId: string, maxPerDay: number): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const day = dayKeyUTC();
  const key = `${tenantId}:${day}`;
  const next = (usage.get(key) ?? 0) + 1;
  usage.set(key, next);
  if (next > maxPerDay) {
    const now = new Date();
    const end = new Date(`${day}T23:59:59.999Z`);
    const retryAfterSeconds = Math.max(60, Math.ceil((end.getTime() - now.getTime()) / 1000));
    return { ok: false, retryAfterSeconds };
  }
  return { ok: true };
}

function normalizeMessages(raw: unknown): AssistantChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: AssistantChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as any).role;
    const content = (m as any).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const c = content.trim();
    if (!c) continue;
    out.push({ role, content: c.slice(0, 8000) });
  }
  return out.slice(-20);
}

async function tenantDbForAdmin(app: any, tenantId: string): Promise<Db> {
  const cached = tenantDbCache.get(tenantId);
  if (cached) return cached;

  const encKey = app.config.tenantDsnEncryptionKey;
  if (!encKey) throw new Error("TENANT_DSN_ENCRYPTION_KEY not configured");

  const dsn = await getTenantDbDsn(app.controlDb, tenantId, encKey);

  if ((process.env.AUTO_MIGRATE_TENANT ?? "true") !== "false") {
    const dir = resolve(process.cwd(), "apps/api/migrations-tenant");
    await runSqlMigrations(dsn, dir);
  }

  const db = createDb(dsn);
  tenantDbCache.set(tenantId, db);
  return db;
}

export const adminAssistantRoutes: FastifyPluginAsync = async (app) => {
  const { config } = app;

  app.addHook("onRequest", async (req, reply) => {
    // 1) Break-glass key (server-side)
    const providedKey = String(req.headers["x-platform-admin-key"] ?? "");
    if (config.platformAdminKey && providedKey && providedKey === config.platformAdminKey) {
      req.platformUser = { sub: "platform-admin-key", role: "admin", raw: {} as any };
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
        req.platformUser = user;
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

  app.post<{ Body: { tenantId: string; messages: unknown } }>("/admin/assistant/chat", async (req, reply) => {
    if (!config.aiSetupEnabled) {
      return reply.code(501).send({ error: "AI setup assistant is disabled (AI_SETUP_ENABLED=false)" });
    }
    if (!config.openAiApiKey) {
      return reply.code(501).send({ error: "OPENAI_API_KEY not configured" });
    }

    const tenantId = String((req.body as any)?.tenantId ?? "").trim();
    if (!tenantId) return reply.code(400).send({ error: "tenantId is required" });

    const bump = bumpUsage(tenantId, config.aiSetupMaxRequestsPerTenantPerDay);
    if (!bump.ok) {
      reply.header("retry-after", String(bump.retryAfterSeconds));
      return reply.code(429).send({ error: "Daily assistant request limit reached for this tenant. Try again tomorrow." });
    }

    const messages = normalizeMessages((req.body as any)?.messages);
    if (!messages) return reply.code(400).send({ error: "messages must be an array of {role,user|assistant, content}" });

    const tenantDb = await tenantDbForAdmin(app as any, tenantId);
    const actorSub = req.platformUser?.sub ?? "platform-admin";

    const client = createOpenAiClient({
      apiKey: config.openAiApiKey,
      baseUrl: (process.env.OPENAI_BASE_URL ?? "").trim() || undefined,
    });

    const systemPrompt = [
      "You are VirtuaSOC Setup Assistant (Platform Admin mode).",
      "You are configuring a specific tenant selected by the platform operator.",
      "ONLY apply these tenant configuration changes using tools:",
      "- RSS feed selection (add/remove/enable/disable)",
      "- RSS ingest defaults (default tags, auto-triage status)",
      "- Distribution targets (email targets, per-tenant Teams webhook)",
      "",
      "Rules:",
      "- Use ONLY the provided tools. Auto-apply is enabled.",
      "- Keep responses concise and summarize what you changed.",
    ].join("\n");

    const tools = buildSetupAssistantTools({ tenantId, db: tenantDb, actorSub });

    const result = await runAssistantAgent(
      client,
      {
        model: config.openAiModel,
        systemPrompt,
        maxToolCalls: config.aiSetupMaxToolCalls,
        maxOutputTokens: config.aiSetupMaxOutputTokens,
      },
      messages,
      tools,
    );

    return { reply: result.reply, appliedActions: result.appliedActions };
  });
};


