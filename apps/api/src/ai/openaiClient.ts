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
      role?: string;
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
};

export type OpenAiChatCompletionResult = {
  content: string | null;
  toolCalls: OpenAiToolCall[];
};

export type OpenAiClient = {
  chat: (args: {
    model: string;
    messages: OpenAiChatMessage[];
    tools?: OpenAiTool[];
    maxOutputTokens?: number;
  }) => Promise<OpenAiChatCompletionResult>;
};

export function createOpenAiClient(opts: {
  apiKey: string;
  baseUrl?: string;
}): OpenAiClient {
  const baseUrl = (opts.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const apiKey = opts.apiKey.trim();
  if (!apiKey) throw new Error("OpenAI apiKey is empty");

  async function chat(args: {
    model: string;
    messages: OpenAiChatMessage[];
    tools?: OpenAiTool[];
    maxOutputTokens?: number;
  }): Promise<OpenAiChatCompletionResult> {
    const model = args.model.trim();
    if (!model) throw new Error("OpenAI model is empty");

    const payload: Record<string, unknown> = {
      model,
      messages: args.messages,
      temperature: 0.2,
    };
    if (args.tools?.length) {
      payload.tools = args.tools;
      payload.tool_choice = "auto";
    }
    if (typeof args.maxOutputTokens === "number" && Number.isFinite(args.maxOutputTokens)) {
      // Chat Completions uses max_tokens.
      payload.max_tokens = Math.max(1, Math.floor(args.maxOutputTokens));
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
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
    const content = msg?.content ?? null;
    const toolCalls = Array.isArray(msg?.tool_calls) ? msg!.tool_calls! : [];
    return { content, toolCalls };
  }

  return { chat };
}


