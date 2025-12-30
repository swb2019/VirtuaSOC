import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth";

const SESSION_KEYS = {
  state: "platform_oidc_state",
  verifier: "platform_oidc_code_verifier",
  tokenEndpoint: "platform_oidc_token_endpoint",
  clientId: "platform_oidc_client_id",
};

export function AdminOidcCallbackPage() {
  const nav = useNavigate();
  const { setAdminToken } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const expectedState = sessionStorage.getItem(SESSION_KEYS.state);
      const codeVerifier = sessionStorage.getItem(SESSION_KEYS.verifier);
      const tokenEndpoint = sessionStorage.getItem(SESSION_KEYS.tokenEndpoint);
      const clientId = sessionStorage.getItem(SESSION_KEYS.clientId);

      if (!code || !state) throw new Error("Missing code/state");
      if (!expectedState || state !== expectedState) throw new Error("State mismatch");
      if (!codeVerifier || !tokenEndpoint || !clientId) throw new Error("Missing PKCE session values");

      const redirectUri = `${window.location.origin}/admin/oidc/callback`;

      const body = new URLSearchParams();
      body.set("grant_type", "authorization_code");
      body.set("code", code);
      body.set("redirect_uri", redirectUri);
      body.set("client_id", clientId);
      body.set("code_verifier", codeVerifier);

      const res = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
      const tok = (await res.json()) as { access_token?: string; id_token?: string };
      const bearer = tok.id_token ?? tok.access_token;
      if (!bearer) throw new Error("Missing id_token/access_token");

      setAdminToken(bearer);
      nav("/admin/tenants", { replace: true });
    }

    run().catch((e) => setErr(String(e?.message ?? e)));
  }, [nav, setAdminToken]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <div className="text-lg font-semibold">VirtuaSOC</div>
        <div className="mt-2 text-sm text-slate-300">Completing admin sign-in…</div>
        {err ? <div className="mt-4 text-sm text-rose-300">{err}</div> : null}
      </div>
    </div>
  );
}


