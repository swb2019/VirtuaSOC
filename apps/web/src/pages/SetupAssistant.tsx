import { useMemo, useState } from "react";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function SetupAssistantPage() {
  const { token, tenantSlug } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined, tenantSlug }), [token, tenantSlug]);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Tell me what you’re setting up (industry, region, and what you want to ingest). I can configure RSS feeds, RSS ingest defaults (tags/auto-triage), and distribution targets.",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ tool: string; input: unknown; output: unknown }[]>([]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setErr(null);
    setSending(true);
    setInput("");

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);

    try {
      const res = await api.assistantChat(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
      setApplied(res.appliedActions ?? []);
    } catch (e) {
      setErr(String((e as any)?.message ?? e));
      // restore input to let user retry
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-6 py-4">
          <div className="text-lg font-semibold">Setup Assistant</div>
          <div className="mt-1 text-sm text-slate-400">AI-guided tenant configuration (auto-applies changes)</div>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-auto px-6 py-5">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm " +
                  (m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-800 bg-slate-950/40 text-slate-100")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {err ? (
          <div className="mx-6 mb-4 rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="border-t border-slate-800 px-6 py-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Set up RSS feeds for US healthcare security alerts; tag as healthcare,cisa and auto-triage"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter") send().catch(() => {});
              }}
            />
            <button
              onClick={() => send().catch(() => {})}
              disabled={sending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tip: include your industry, region, and whether you want auto-triage (<code>new</code> vs <code>triaged</code>).
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Applied changes</div>
          <div className="mt-1 text-xs text-slate-500">What the assistant actually changed via tools.</div>
          <div className="mt-4 space-y-3">
            {applied.map((a, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-xs font-semibold text-slate-200">{a.tool}</div>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                  {JSON.stringify({ input: a.input, output: a.output }, null, 2)}
                </pre>
              </div>
            ))}
            {!applied.length ? <div className="text-sm text-slate-500">No changes yet.</div> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Example prompts</div>
          <div className="mt-3 grid gap-2 text-sm">
            {[
              "Set up RSS feeds for US government advisories and tag items as cisa,advisory. Auto-triage to triaged.",
              "Add an email distribution target: soc-leads@myco.com (label: SOC Leads).",
              "Set my tenant Teams webhook to https://... and keep report distribution enabled.",
              "Disable the feed https://www.cisa.gov/uscert/ncas/alerts.xml.",
            ].map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-left text-slate-100 hover:border-slate-700"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


