import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function EvidencePage() {
  const { token, tenantSlug } = useAuth();
  const nav = useNavigate();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined, tenantSlug }), [token, tenantSlug]);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<"all" | "new" | "triaged">("all");
  const [tag, setTag] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState<string>("");
  const [editTags, setEditTags] = useState<{ id: string; tagsText: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .listEvidence({
        q: q.trim() ? q.trim() : undefined,
        status: status === "all" ? undefined : status,
        tag: tag.trim() ? tag.trim() : undefined,
      })
      .then((r) => setItems(r.evidence))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, q, status, tag]);

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
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="triaged">Triaged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400">Tag</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. cisa"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title/content…"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </div>
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Fetched</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/30">
            {items.map((e) => (
              <Fragment key={e.id}>
                <tr key={e.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold text-slate-100">{e.title ?? e.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold " +
                        (e.triage_status === "triaged"
                          ? "bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-900/40"
                          : "bg-sky-950/30 text-sky-200 ring-1 ring-sky-900/40")
                      }
                    >
                      {e.triage_status ?? "new"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(e.tags ?? []).slice(0, 6).map((t: string) => (
                        <span
                          key={t}
                          className="rounded-md border border-slate-800 bg-slate-950/30 px-2 py-1 text-xs text-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                      {!e.tags?.length ? <span className="text-xs text-slate-500">—</span> : null}
                    </div>
                  </td>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setErr(null);
                          const next = e.triage_status === "triaged" ? "new" : "triaged";
                          api
                            .updateEvidence(e.id, { triageStatus: next })
                            .then(() =>
                              api.listEvidence({
                                q: q.trim() ? q.trim() : undefined,
                                status: status === "all" ? undefined : status,
                                tag: tag.trim() ? tag.trim() : undefined,
                              }),
                            )
                            .then((r) => setItems(r.evidence))
                            .catch((ex) => setErr(String(ex?.message ?? ex)));
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                      >
                        {e.triage_status === "triaged" ? "Mark new" : "Mark triaged"}
                      </button>
                      <button
                        onClick={() => {
                          const current = Array.isArray(e.tags) ? e.tags.join(", ") : "";
                          setEditTags({ id: e.id, tagsText: current });
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                      >
                        Edit tags
                      </button>
                      <button
                        onClick={() => nav(`/reports/new?evidenceId=${encodeURIComponent(e.id)}`)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        New report
                      </button>
                    </div>
                  </td>
                </tr>

                {editTags && editTags.id === e.id ? (
                  <tr className="bg-slate-950/20">
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold text-slate-400">Tags (comma-separated)</div>
                        <input
                          value={editTags.tagsText}
                          onChange={(ev) => setEditTags({ id: e.id, tagsText: ev.target.value })}
                          className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                        />
                        <button
                          onClick={() => {
                            setErr(null);
                            const tagsList = editTags.tagsText
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            api
                              .updateEvidence(e.id, { tags: tagsList })
                              .then(() => api.listEvidence({ q: q.trim() ? q.trim() : undefined, status: status === "all" ? undefined : status, tag: tag.trim() ? tag.trim() : undefined }))
                              .then((r) => setItems(r.evidence))
                              .then(() => setEditTags(null))
                              .catch((ex) => setErr(String(ex?.message ?? ex)));
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditTags(null)}
                          className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {!items.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
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


