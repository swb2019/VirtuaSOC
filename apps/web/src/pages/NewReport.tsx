import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function NewReportPage() {
  const { token, tenantSlug } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined, tenantSlug }), [token, tenantSlug]);
  const nav = useNavigate();
  const loc = useLocation();

  const [defs, setDefs] = useState<{ id: string; title: string; description: string }[]>([]);
  const [definitionId, setDefinitionId] = useState<string>("sitrep");
  const [title, setTitle] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .reportDefinitions()
      .then((r) => {
        setDefs(r.definitions);
        if (r.definitions.find((d) => d.id === "sitrep")) setDefinitionId("sitrep");
        else if (r.definitions[0]) setDefinitionId(r.definitions[0].id);
      })
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api]);

  async function create() {
    setErr(null);
    const url = new URL(loc.pathname + loc.search, window.location.origin);
    const evidenceId = url.searchParams.get("evidenceId")?.trim() || "";
    const evidenceIds = evidenceId ? [evidenceId] : undefined;

    const created = await api.createReport(definitionId, title.trim() ? title.trim() : undefined, evidenceIds);
    nav(`/reports/${created.id}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">New report</div>
        <div className="text-sm text-slate-400">Create from a report definition</div>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</div> : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {(() => {
          const url = new URL(loc.pathname + loc.search, window.location.origin);
          const evidenceId = url.searchParams.get("evidenceId")?.trim() || "";
          if (!evidenceId) return null;
          return (
            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-200">
              This report will include evidence <code className="text-slate-300">{evidenceId}</code>.
            </div>
          );
        })()}
        <label className="block text-sm font-semibold text-slate-200">Definition</label>
        <select
          value={definitionId}
          onChange={(e) => setDefinitionId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          {defs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-semibold text-slate-200">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Override title…"
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => create().catch((e) => setErr(String(e?.message ?? e)))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create
          </button>
          <button
            onClick={() => nav("/reports")}
            className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


