import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AdminApiClient } from "../../api/client";
import { useAuth } from "../../auth";

type Tenant = { id: string; slug: string; name: string; createdAt: string };

export function AdminTenantsPage() {
  const { adminToken } = useAuth();
  const nav = useNavigate();
  const api = useMemo(() => new AdminApiClient({ token: adminToken ?? undefined }), [adminToken]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [newSlug, setNewSlug] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const res = await api.listTenants();
        setTenants(res.tenants);
      } catch (e) {
        setErr(String((e as any)?.message ?? e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [api]);

  async function createTenant() {
    setErr(null);
    setCreating(true);
    try {
      const slug = newSlug.trim().toLowerCase();
      const name = newName.trim();
      if (!slug) throw new Error("slug is required");
      if (!name) throw new Error("name is required");

      const res = await api.createTenant({ slug, name });
      nav(`/admin/tenants/${encodeURIComponent(res.tenant.id)}`, { replace: true });
    } catch (e) {
      setErr(String((e as any)?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Tenants</div>
          <div className="mt-1 text-sm text-slate-400">Create and configure tenant OIDC settings.</div>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
        >
          Back to app
        </Link>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">{err}</div> : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-semibold text-slate-200">Create tenant</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400">Slug</label>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="demo"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Demo"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            disabled={creating}
            onClick={createTenant}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-semibold text-slate-200">Existing tenants</div>
        {loading ? (
          <div className="mt-4 text-sm text-slate-400">Loading…</div>
        ) : tenants.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t border-slate-800/60">
                    <td className="py-2">
                      <Link to={`/admin/tenants/${encodeURIComponent(t.id)}`} className="text-indigo-300 hover:text-indigo-200">
                        {t.slug}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-200">{t.name}</td>
                    <td className="py-2 text-slate-400">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400">No tenants yet.</div>
        )}
      </section>
    </div>
  );
}


