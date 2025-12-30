import { useEffect, useMemo, useState } from "react";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function EvidencePage() {
  const { token } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined }), [token]);
  const [q, setQ] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .listEvidence(q.trim() ? q.trim() : undefined)
      .then((r) => setItems(r.evidence))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, q]);

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


