import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type TenantAuthProvider = {
  issuer: string;
  clientId: string;
  roleClaimPath: string;
  audience?: string;
  enforceAudience?: boolean;
  roleMapping: Record<string, string>;
};

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const discoveryByIssuer = new Map<string, Promise<{ jwks_uri: string }>>();

async function loadDiscovery(issuer: string): Promise<{ jwks_uri: string }> {
  const cached = discoveryByIssuer.get(issuer);
  if (cached) return cached;

  const url = new URL(".well-known/openid-configuration", issuer.endsWith("/") ? issuer : `${issuer}/`);
  const p = fetch(url)
    .then(async (r) => {
      if (!r.ok) throw new Error(`OIDC discovery failed: ${r.status}`);
      return (await r.json()) as { jwks_uri: string };
    })
    .then((cfg) => {
      if (!cfg?.jwks_uri) throw new Error("OIDC discovery missing jwks_uri");
      return cfg;
    });
  discoveryByIssuer.set(issuer, p);
  return p;
}

async function jwksForIssuer(issuer: string) {
  const existing = jwksByIssuer.get(issuer);
  if (existing) return existing;
  const { jwks_uri } = await loadDiscovery(issuer);
  const jwks = createRemoteJWKSet(new URL(jwks_uri));
  jwksByIssuer.set(issuer, jwks);
  return jwks;
}

function getClaimAtPath(payload: JWTPayload, path: string): unknown {
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  let cur: any = payload;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

const roleOrder = ["viewer", "gsoc_analyst", "gsoc_lead", "admin"] as const;
type Role = (typeof roleOrder)[number];

function bestRole(roles: Role[]): Role {
  let best: Role = "viewer";
  for (const r of roles) {
    if (roleOrder.indexOf(r) > roleOrder.indexOf(best)) best = r;
  }
  return best;
}

function mapRole(payload: JWTPayload, provider: TenantAuthProvider): Role {
  const claimValues = normalizeStringArray(getClaimAtPath(payload, provider.roleClaimPath));
  const mapped = claimValues
    .map((v) => provider.roleMapping?.[v])
    .filter((v): v is Role => v === "viewer" || v === "gsoc_analyst" || v === "gsoc_lead" || v === "admin");

  if (!mapped.length) return "viewer";
  return bestRole(mapped);
}

export type OidcAuthUser = {
  sub: string;
  email?: string;
  displayName?: string;
  role: Role;
  raw: JWTPayload;
};

export async function verifyOidcAccessToken(token: string, provider: TenantAuthProvider): Promise<OidcAuthUser> {
  const jwks = await jwksForIssuer(provider.issuer);
  const { payload } = await jwtVerify(token, jwks, {
    issuer: provider.issuer,
    // Optional (recommended for Entra id_tokens): validate aud when configured per tenant.
    audience: provider.enforceAudience ? provider.audience : undefined,
  });

  const sub = String(payload.sub ?? "");
  if (!sub) throw new Error("Missing sub");

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const displayName =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : email;

  const role = mapRole(payload, provider);

  return { sub, email, displayName, role, raw: payload };
}


