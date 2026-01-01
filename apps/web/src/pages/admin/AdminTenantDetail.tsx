import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AdminApiClient } from "../../api/client";
import { useAuth } from "../../auth";

export function AdminTenantDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { adminToken } = useAuth();
  const api = useMemo(() => new AdminApiClient({ token: adminToken ?? undefined }), [adminToken]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [slug, setSlug] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [oidcEnabled, setOidcEnabled] = useState<boolean>(false);
  const [issuer, setIssuer] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [scopes, setScopes] = useState<string>("openid profile email");
  const [roleClaimPath, setRoleClaimPath] = useState<string>("groups");
  const [enforceAudience, setEnforceAudience] = useState<boolean>(true);
  const [audience, setAudience] = useState<string>("");
  const [roleMappingText, setRoleMappingText] = useState<string>("{}");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const tenantId = String(id ?? "").trim();
        if (!tenantId) throw new Error("Missing tenant id");

        const res = await api.getTenant(tenantId);
        setSlug(res.tenant.slug);
        setName(res.tenant.name);

        if (res.oidc) {
          setOidcEnabled(true);
          setIssuer(res.oidc.issuer);
          setClientId(res.oidc.clientId);
          setScopes(res.oidc.scopes);
          setRoleClaimPath(res.oidc.roleClaimPath || "roles");
          setEnforceAudience(Boolean(res.oidc.enforceAudience));
          setAudience(res.oidc.audience ?? res.oidc.clientId);
          setRoleMappingText(JSON.stringify(res.oidc.roleMapping ?? {}, null, 2));
        } else {
          setOidcEnabled(false);
          setIssuer("");
          setClientId("");
          setScopes("openid profile email");
          setRoleClaimPath("roles");
          setEnforceAudience(true);
          setAudience("");
          setRoleMappingText("{}");
        }
      } catch (e) {
        setErr(String((e as any)?.message ?? e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [api, id]);

  function parseRoleMapping(): Record<string, string> {
    const raw = roleMappingText.trim() || "{}";
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("roleMapping must be a JSON object");
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const tenantId = String(id ?? "").trim();
      if (!tenantId) throw new Error("Missing tenant id");

      const nextName = name.trim();
      if (!nextName) throw new Error("name is required");

      if (!oidcEnabled) {
        await api.updateTenant(tenantId, { name: nextName, oidc: null });
        nav("/admin/tenants", { replace: true });
        return;
      }

      const nextIssuer = issuer.trim();
      const nextClientId = clientId.trim();
      if (!nextIssuer) throw new Error("issuer is required");
      if (!nextClientId) throw new Error("clientId is required");

      const nextScopes = scopes.trim() || "openid profile email";
      const nextRoleClaimPath = roleClaimPath.trim() || "roles";
      const nextRoleMapping = parseRoleMapping();

      await api.updateTenant(tenantId, {
        name: nextName,
        oidc: {
          issuer: nextIssuer,
          clientId: nextClientId,
          scopes: nextScopes,
          roleClaimPath: nextRoleClaimPath,
          enforceAudience,
          audience: (audience.trim() || nextClientId) as string,
          roleMapping: nextRoleMapping,
        },
      });

      nav("/admin/tenants", { replace: true });
    } catch (e) {
      setErr(String((e as any)?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Tenant</div>
          <div className="mt-1 text-sm text-slate-400">
            <span className="font-mono text-slate-200">{slug || "(loading…)"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={id ? `/admin/tenants/${encodeURIComponent(id)}/assistant` : "/admin/tenants"}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Setup Assistant
          </Link>
          <Link
            to="/admin/tenants"
            className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
          >
            Back
          </Link>
        </div>
      </div>

      {err ? <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">{err}</div> : null}

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400">Slug</label>
              <input
                value={slug}
                disabled
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">Tenant OIDC</div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={oidcEnabled} onChange={(e) => setOidcEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>

            {oidcEnabled ? (
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Issuer</label>
                  <input
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="https://login.microsoftonline.com/<tenantId>/v2.0"
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Client ID</label>
                    <input
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Scopes</label>
                    <input
                      value={scopes}
                      onChange={(e) => setScopes(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Role claim path</label>
                    <input
                      value={roleClaimPath}
                      onChange={(e) => setRoleClaimPath(e.target.value)}
                      placeholder="roles"
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      Examples: <code>groups</code> (Entra groups) or <code>roles</code> (Entra App Roles)
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Role mapping (JSON)</label>
                    <textarea
                      value={roleMappingText}
                      onChange={(e) => setRoleMappingText(e.target.value)}
                      rows={6}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-xs text-slate-100"
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      Map IdP values → VirtuaSOC roles (viewer, gsoc_analyst, gsoc_lead, admin).
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Audience (aud)</label>
                    <input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder={clientId || "(clientId)"}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      For Entra <code>id_token</code>, this is typically the client ID.
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={enforceAudience}
                        onChange={(e) => setEnforceAudience(e.target.checked)}
                      />
                      Enforce audience validation
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400">OIDC is disabled for this tenant.</div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              disabled={saving}
              onClick={() => nav("/admin/tenants")}
              className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}


