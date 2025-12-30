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
  const { token } = useAuth();
  const nav = useNavigate();

  const api = useMemo(() => new ApiClient({ token: token ?? undefined }), [token]);
  const [status, setStatus] = useState<string>("Loading OIDC config…");
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <div className="text-lg font-semibold">VirtuaSOC</div>
        <div className="mt-1 text-sm text-slate-400">Analyst Workbench</div>

        <div className="mt-6 text-sm text-slate-300">{status}</div>
        {err ? <div className="mt-3 text-sm text-rose-300">{err}</div> : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => beginLogin().catch((e) => setErr(String(e?.message ?? e)))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in with SSO
          </button>
          <button
            onClick={() => nav("/")}
            className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


