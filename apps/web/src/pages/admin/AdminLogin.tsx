import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AdminApiClient } from "../../api/client";
import { useAuth } from "../../auth";
import { randomString, sha256Base64Url } from "../../oidc/pkce";

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
};

const SESSION_KEYS = {
  state: "platform_oidc_state",
  verifier: "platform_oidc_code_verifier",
  tokenEndpoint: "platform_oidc_token_endpoint",
  clientId: "platform_oidc_client_id",
};

export function AdminLoginPage() {
  const { adminToken } = useAuth();
  const nav = useNavigate();

  const api = useMemo(() => new AdminApiClient({ token: adminToken ?? undefined }), [adminToken]);
  const [status, setStatus] = useState<string>("Ready");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (adminToken) nav("/admin/tenants", { replace: true });
  }, [adminToken, nav]);

  async function beginLogin() {
    setErr(null);
    setStatus("Fetching platform OIDC config…");

    const cfg = await api.platformOidcConfig();
    setStatus("Fetching OIDC discovery…");

    const discRes = await fetch(
      new URL(".well-known/openid-configuration", cfg.issuer.endsWith("/") ? cfg.issuer : `${cfg.issuer}/`).toString(),
    );
    if (!discRes.ok) throw new Error(`OIDC discovery failed: ${discRes.status}`);
    const disc = (await discRes.json()) as OidcDiscovery;

    const redirectUri = `${window.location.origin}/admin/oidc/callback`;
    const state = randomString(24);
    const codeVerifier = randomString(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);

    sessionStorage.setItem(SESSION_KEYS.state, state);
    sessionStorage.setItem(SESSION_KEYS.verifier, codeVerifier);
    sessionStorage.setItem(SESSION_KEYS.tokenEndpoint, disc.token_endpoint);
    sessionStorage.setItem(SESSION_KEYS.clientId, cfg.clientId);

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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <div className="text-lg font-semibold">VirtuaSOC</div>
        <div className="mt-1 text-sm text-slate-400">Tenant Administration</div>

        <div className="mt-6 text-sm text-slate-300">{status}</div>
        {err ? <div className="mt-3 text-sm text-rose-300">{err}</div> : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => beginLogin().catch((e) => setErr(String(e?.message ?? e)))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in (Platform SSO)
          </button>
          <button
            onClick={() => nav("/")}
            className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
          >
            Back to app
          </button>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">
          This admin area is protected by platform operator OIDC. Configure the platform issuer/clientId in the API
          environment and redeploy.
        </div>
      </div>
    </div>
  );
}


