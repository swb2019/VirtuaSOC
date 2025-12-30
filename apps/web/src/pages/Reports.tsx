import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function ReportsPage() {
  const { token } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined }), [token]);
  const [reports, setReports] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .listReports()
      .then((r) => setReports(r.reports))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Reports</div>
          <div className="text-sm text-slate-400">Drafts, reviews, and published products</div>
        </div>
        <Link
          to="/reports/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          New report
        </Link>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/60 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Definition</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/30">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-slate-100 hover:underline" to={`/reports/${r.id}`}>
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.definition_id}</td>
                <td className="px-4 py-3 text-slate-300">{r.status}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!reports.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={4}>
                  No reports yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}


