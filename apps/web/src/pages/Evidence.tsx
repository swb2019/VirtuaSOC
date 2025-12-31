import { useEffect, useMemo, useState } from "react";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function EvidencePage() {
  const { token, tenantSlug } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined, tenantSlug }), [token, tenantSlug]);
  const [q, setQ] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .listEvidence(q.trim() ? q.trim() : undefined)
      .then((r) => setItems(r.evidence))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, q]);

  useEffect(() => {
    api
      .listRssFeeds()
      .then((r) => setFeeds(r.feeds))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Evidence</div>
          <div className="text-sm text-slate-400">Ingested sources (RSS/manual)</div>
        </div>
        <div className="w-full max-w-md">
          <label className="block text-xs font-semibold text-slate-400">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title/content…"
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </div>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</div> : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">RSS feeds</div>
            <div className="mt-1 text-xs text-slate-500">Worker ingests feeds every ~15 minutes.</div>
          </div>
          <div className="flex w-full max-w-xl gap-2">
            <input
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
            <button
              onClick={() => {
                setErr(null);
                const url = newFeedUrl.trim();
                if (!url) return;
                api
                  .addRssFeed(url)
                  .then(() => api.listRssFeeds())
                  .then((r) => {
                    setFeeds(r.feeds);
                    setNewFeedUrl("");
                  })
                  .catch((e) => setErr(String(e?.message ?? e)));
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {feeds.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-200">{f.url}</div>
                <div className="mt-1 text-xs text-slate-500">{f.enabled ? "enabled" : "disabled"}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setErr(null);
                    api
                      .updateRssFeed(f.id, { enabled: !f.enabled })
                      .then(() => api.listRssFeeds())
                      .then((r) => setFeeds(r.feeds))
                      .catch((e) => setErr(String(e?.message ?? e)));
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                >
                  {f.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    setErr(null);
                    api
                      .deleteRssFeed(f.id)
                      .then(() => api.listRssFeeds())
                      .then((r) => setFeeds(r.feeds))
                      .catch((e) => setErr(String(e?.message ?? e)));
                  }}
                  className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900/70"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!feeds.length ? <div className="text-sm text-slate-500">No RSS feeds configured (worker uses defaults).</div> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/60 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Fetched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/30">
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 font-semibold text-slate-100">{e.title ?? e.id}</td>
                <td className="px-4 py-3 text-slate-300">
                  {e.source_uri ? (
                    <a className="text-sky-300 hover:underline" href={e.source_uri} target="_blank" rel="noreferrer">
                      link
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(e.fetched_at).toLocaleString()}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={3}>
                  No evidence yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}


