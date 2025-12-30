import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";
import { randomString, sha256Base64Url } from "../oidc/pkce";

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
};

export function LoginPage() {
  const { token, setToken, tenantSlug, setTenantSlug } = useAuth();
  const nav = useNavigate();

  const api = useMemo(
    () => new ApiClient({ token: token ?? undefined, tenantSlug }),
    [token, tenantSlug],
  );
  const [status, setStatus] = useState<string>("Loading OIDC config…");
  const [err, setErr] = useState<string | null>(null);
  const [platformAdminKey, setPlatformAdminKey] = useState<string>("");
  const [localSub, setLocalSub] = useState<string>("platform-admin");
  const showBreakGlass =
    !import.meta.env.PROD || new URLSearchParams(window.location.search).get("breakGlass") === "1";

  useEffect(() => {
    if (token) nav("/reports");
  }, [token, nav]);

  async function beginLogin() {
    setErr(null);
    setStatus("Fetching tenant OIDC config…");

    const cfg = await api.oidcConfig();
    setStatus("Fetching OIDC discovery…");

    const discRes = await fetch(
      new URL(".well-known/openid-configuration", cfg.issuer.endsWith("/") ? cfg.issuer : `${cfg.issuer}/`).toString(),
    );
    if (!discRes.ok) throw new Error(`OIDC discovery failed: ${discRes.status}`);
    const disc = (await discRes.json()) as OidcDiscovery;

    const redirectUri = `${window.location.origin}/oidc/callback`;
    const state = randomString(24);
    const codeVerifier = randomString(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);

    sessionStorage.setItem("oidc_state", state);
    sessionStorage.setItem("oidc_code_verifier", codeVerifier);
    sessionStorage.setItem("oidc_token_endpoint", disc.token_endpoint);
    sessionStorage.setItem("oidc_client_id", cfg.clientId);

    const authUrl = new URL(disc.authorization_endpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", cfg.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", cfg.scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    window.location.assign(authUrl.toString());
  }

  async function localLogin() {
    setErr(null);
    setStatus("Requesting local token…");

    const res = await fetch("/api/admin/token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-platform-admin-key": platformAdminKey,
      },
      body: JSON.stringify({ sub: localSub, role: "admin" }),
    });
    if (!res.ok) throw new Error(`Local token request failed: ${res.status}`);
    const json = (await res.json()) as { token?: string };
    if (!json.token) throw new Error("Missing token");
    return json.token;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <div className="text-lg font-semibold">VirtuaSOC</div>
        <div className="mt-1 text-sm text-slate-400">Analyst Workbench</div>

        <div className="mt-6">
          <label className="block text-xs font-semibold text-slate-400">Tenant slug</label>
          <input
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="demo"
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
          <div className="mt-2 text-xs text-slate-500">
            For quick public launch without wildcard DNS, VirtuaSOC uses this value via <code>X-Tenant-Slug</code>.
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-300">{status}</div>
        {err ? <div className="mt-3 text-sm text-rose-300">{err}</div> : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => beginLogin().catch((e) => setErr(String(e?.message ?? e)))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in with SSO
          </button>
          {showBreakGlass ? (
            <button
              onClick={() =>
                localLogin()
                  .then((t) => {
                    // Store token and proceed.
                    // (AuthProvider stores to localStorage)
                    setToken(t);
                    nav("/reports", { replace: true });
                  })
                  .catch((e) => setErr(String(e?.message ?? e)))
              }
              className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
            >
              Local admin (break-glass)
            </button>
          ) : null}
          <button
            onClick={() => nav("/")}
            className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
          >
            Cancel
          </button>
        </div>

        {showBreakGlass ? (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="text-sm font-semibold text-slate-200">Local admin (break-glass)</div>
            <div className="mt-2 text-xs text-slate-500">
              Use this only when enterprise SSO isn’t configured yet. Requires <code>X-Platform-Admin-Key</code>.
            </div>

            <label className="mt-4 block text-xs font-semibold text-slate-400">Platform admin key</label>
            <input
              value={platformAdminKey}
              onChange={(e) => setPlatformAdminKey(e.target.value)}
              placeholder="(provided during deploy)"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />

            <label className="mt-4 block text-xs font-semibold text-slate-400">Subject (sub)</label>
            <input
              value={localSub}
              onChange={(e) => setLocalSub(e.target.value)}
              placeholder="platform-admin"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}


