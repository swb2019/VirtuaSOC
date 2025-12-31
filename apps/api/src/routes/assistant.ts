import type { FastifyPluginAsync } from "fastify";

import { createOpenAiClient } from "../ai/openaiClient.js";
import { runAssistantAgent, type AssistantChatMessage } from "../ai/assistantAgent.js";
import { buildSetupAssistantTools } from "../assistant/tools.js";
import { requireRole } from "../auth/guards.js";

const usage = new Map<string, number>();

function dayKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function bumpUsage(tenantId: string, maxPerDay: number): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const day = dayKeyUTC();
  const key = `${tenantId}:${day}`;
  const next = (usage.get(key) ?? 0) + 1;
  usage.set(key, next);
  if (next > maxPerDay) {
    // until next UTC day
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
  // Keep last N messages for cost control.
  return out.slice(-20);
}

export const assistantRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { messages: unknown } }>("/assistant/chat", async (req, reply) => {
    const { config } = app;
    if (!config.aiSetupEnabled) {
      return reply.code(501).send({ error: "AI setup assistant is disabled (AI_SETUP_ENABLED=false)" });
    }
    if (!config.openAiApiKey) {
      return reply.code(501).send({ error: "OPENAI_API_KEY not configured" });
    }

    const tenant = req.tenant!;
    const db = req.tenantDb!;
    const actor = requireRole(req, reply, "gsoc_analyst");
    if (!actor) return;

    const bump = bumpUsage(tenant.id, config.aiSetupMaxRequestsPerTenantPerDay);
    if (!bump.ok) {
      reply.header("retry-after", String(bump.retryAfterSeconds));
      return reply.code(429).send({ error: "Daily assistant request limit reached. Try again tomorrow." });
    }

    const messages = normalizeMessages((req.body as any)?.messages);
    if (!messages) return reply.code(400).send({ error: "messages must be an array of {role,user|assistant, content}" });

    const client = createOpenAiClient({
      apiKey: config.openAiApiKey,
      baseUrl: (process.env.OPENAI_BASE_URL ?? "").trim() || undefined,
    });

    const systemPrompt = [
      "You are VirtuaSOC Setup Assistant.",
      "You ONLY help configure tenant setup and preferences:",
      "- RSS feed selection (add/remove/enable/disable)",
      "- RSS ingest defaults (default tags, auto-triage status)",
      "- Distribution targets (email targets, per-tenant Teams webhook)",
      "",
      "Rules:",
      "- Use ONLY the provided tools to apply changes. Auto-apply is enabled.",
      "- Do NOT request or output secrets except when the user explicitly provides them for setup (e.g. Teams webhook URL).",
      "- Do NOT access or discuss tenant evidence content; keep the conversation about configuration.",
      "- Keep responses concise, and summarize what you changed.",
    ].join("\n");

    const tools = buildSetupAssistantTools({ tenantId: tenant.id, db, actorSub: actor.sub });

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


