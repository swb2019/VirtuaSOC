export type OpenAiChatMessage =
  | { role: "system" | "user" | "assistant"; content: string | null }
  | { role: "tool"; tool_call_id: string; content: string };

export type OpenAiTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

export type OpenAiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
};

export async function openAiToolCall(args: {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  tool: OpenAiTool;
  toolName: string;
  maxOutputTokens?: number;
  baseUrl?: string;
}): Promise<{ toolArgsJson: unknown; rawText: string | null }> {
  const baseUrl = (args.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");

  const payload: Record<string, unknown> = {
    model: args.model,
    messages: args.messages,
    temperature: 0.2,
    tools: [args.tool],
    tool_choice: { type: "function", function: { name: args.toolName } },
  };
  if (typeof args.maxOutputTokens === "number" && Number.isFinite(args.maxOutputTokens)) {
    payload.max_tokens = Math.max(1, Math.floor(args.maxOutputTokens));
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${args.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI chat failed: ${res.status} ${text}`.trim());
  }

  const json = (await res.json()) as OpenAiChatCompletionResponse;
  const msg = json.choices?.[0]?.message;
  const rawText = msg?.content ?? null;
  const calls = Array.isArray(msg?.tool_calls) ? msg!.tool_calls! : [];
  const call = calls.find((c) => c.function.name === args.toolName) ?? calls[0];
  if (!call) throw new Error("OpenAI did not return a tool call");

  let toolArgsJson: unknown = null;
  try {
    toolArgsJson = JSON.parse(call.function.arguments ?? "null") as unknown;
  } catch (e) {
    throw new Error(`Invalid tool call JSON: ${String((e as any)?.message ?? e)}`);
  }

  return { toolArgsJson, rawText };
}


