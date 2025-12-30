import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AdminApiClient } from "../../api/client";
import { useAuth } from "../../auth";

type AuditEvent = {
  id: string;
  created_at: string;
  actor_sub: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
};

export function AdminAuditPage() {
  const { adminToken } = useAuth();
  const api = useMemo(() => new AdminApiClient({ token: adminToken ?? undefined }), [adminToken]);

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const json = await api.listAudit(100, 0);
        setEvents((json.events ?? []) as AuditEvent[]);
      } catch (e) {
        setErr(String((e as any)?.message ?? e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [api]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Platform audit</div>
          <div className="mt-1 text-sm text-slate-400">Recent platform admin actions.</div>
        </div>
        <Link
          to="/admin/tenants"
          className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
        >
          Back
        </Link>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">{err}</div> : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2">Time</th>
                  <th className="py-2">Actor</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Target</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-slate-800/60 align-top">
                    <td className="py-2 text-slate-400">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="py-2 text-slate-200">
                      <div className="font-mono text-xs">{e.actor_email ?? e.actor_sub ?? "-"}</div>
                    </td>
                    <td className="py-2 text-slate-200">{e.action}</td>
                    <td className="py-2 text-slate-400">
                      {e.target_type ? (
                        <span className="font-mono text-xs">
                          {e.target_type}:{String(e.target_id ?? "")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-400">No events yet.</div>
        )}
      </section>
    </div>
  );
}


