import type { OpenAiChatMessage, OpenAiTool, OpenAiToolCall } from "./openaiClient.js";
import type { OpenAiClient } from "./openaiClient.js";

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantToolSpec = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (args: unknown) => Promise<unknown>;
};

export type AssistantAgentConfig = {
  model: string;
  systemPrompt: string;
  maxToolCalls: number;
  maxOutputTokens: number;
};

export type AssistantAgentResult = {
  reply: string;
  appliedActions: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toolDefs(tools: AssistantToolSpec[]): OpenAiTool[] {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

function toolMap(tools: AssistantToolSpec[]): Map<string, AssistantToolSpec> {
  return new Map(tools.map((t) => [t.name, t]));
}

function normalizeMessages(messages: AssistantChatMessage[]): OpenAiChatMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: String(m.content ?? ""),
  }));
}

async function runToolCall(call: OpenAiToolCall, toolsByName: Map<string, AssistantToolSpec>) {
  const tool = toolsByName.get(call.function.name);
  if (!tool) {
    return { ok: false, error: `Unknown tool: ${call.function.name}` };
  }

  const args = safeJsonParse(call.function.arguments ?? "");
  const output = await tool.run(args);
  return { ok: true, args, output };
}

export async function runAssistantAgent(
  client: OpenAiClient,
  cfg: AssistantAgentConfig,
  inputMessages: AssistantChatMessage[],
  tools: AssistantToolSpec[],
): Promise<AssistantAgentResult> {
  const maxToolCalls = Number.isFinite(cfg.maxToolCalls) ? Math.max(0, Math.floor(cfg.maxToolCalls)) : 0;
  const maxOutputTokens = Number.isFinite(cfg.maxOutputTokens) ? Math.max(1, Math.floor(cfg.maxOutputTokens)) : 600;

  const appliedActions: AssistantAgentResult["appliedActions"] = [];
  const toolsByName = toolMap(tools);

  const messages: OpenAiChatMessage[] = [
    { role: "system", content: cfg.systemPrompt },
    ...normalizeMessages(inputMessages),
  ];

  // Tool-calling loop. Each loop may execute multiple tools, but we cap total tool invocations.
  let toolCallsUsed = 0;
  for (let step = 0; step <= maxToolCalls; step++) {
    const { content, toolCalls } = await client.chat({
      model: cfg.model,
      messages,
      tools: tools.length ? toolDefs(tools) : undefined,
      maxOutputTokens,
    });

    const calls = Array.isArray(toolCalls) ? toolCalls : [];
    if (!calls.length) {
      return { reply: (content ?? "").trim() || "OK.", appliedActions };
    }

    // Append assistant message with tool_calls (as per OpenAI protocol).
    messages.push({
      role: "assistant",
      content: content ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (messages[messages.length - 1] as any).tool_calls = calls;

    for (const call of calls) {
      if (toolCallsUsed >= maxToolCalls) break;
      toolCallsUsed++;

      const result = await runToolCall(call, toolsByName).catch((err) => ({
        ok: false,
        error: String((err as any)?.message ?? err),
      }));

      if ((result as any).ok) {
        appliedActions.push({
          tool: call.function.name,
          input: (result as any).args,
          output: (result as any).output,
        });
      } else {
        appliedActions.push({
          tool: call.function.name,
          input: safeJsonParse(call.function.arguments ?? ""),
          output: { ok: false, error: (result as any).error ?? "Tool failed" },
        });
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    if (toolCallsUsed >= maxToolCalls) break;
  }

  return {
    reply: "I hit the configured tool-call limit while applying setup changes. Please retry or narrow the request.",
    appliedActions,
  };
}


