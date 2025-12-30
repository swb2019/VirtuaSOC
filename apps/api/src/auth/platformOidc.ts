import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export type PlatformRole = (typeof roleOrder)[number];

function isRole(value: unknown): value is PlatformRole {
  return value === "viewer" || value === "gsoc_analyst" || value === "gsoc_lead" || value === "admin";
}

function bestRole(roles: PlatformRole[]): PlatformRole {
  let best: PlatformRole = "viewer";
  for (const r of roles) {
    if (roleOrder.indexOf(r) > roleOrder.indexOf(best)) best = r;
  }
  return best;
}

export type PlatformAuthConfig = {
  issuer: string;
  audience?: string;
  roleClaimPath: string;
  roleMapping: Record<string, string>;
};

export type PlatformAuthUser = {
  sub: string;
  email?: string;
  displayName?: string;
  role: PlatformRole;
  raw: JWTPayload;
};

function mapRole(payload: JWTPayload, cfg: PlatformAuthConfig): PlatformRole {
  const claimValues = normalizeStringArray(getClaimAtPath(payload, cfg.roleClaimPath));

  // Allow either direct roles (e.g. "admin") OR mapped roles (e.g. "VirtuaSOC.PlatformAdmin" -> "admin").
  const mapped = claimValues
    .map((v) => cfg.roleMapping?.[v] ?? v)
    .filter((v): v is PlatformRole => isRole(v));

  if (!mapped.length) return "viewer";
  return bestRole(mapped);
}

export async function verifyPlatformOidcToken(token: string, cfg: PlatformAuthConfig): Promise<PlatformAuthUser> {
  const jwks = await jwksForIssuer(cfg.issuer);

  const verifyOpts: Parameters<typeof jwtVerify>[2] = { issuer: cfg.issuer };
  if (cfg.audience) verifyOpts.audience = cfg.audience;

  const { payload } = await jwtVerify(token, jwks, verifyOpts);

  const sub = String(payload.sub ?? "");
  if (!sub) throw new Error("Missing sub");

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const displayName =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : email;

  const role = mapRole(payload, cfg);
  return { sub, email, displayName, role, raw: payload };
}


