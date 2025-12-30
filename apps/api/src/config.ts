export type ApiConfig = {
  port: number;
  host: string;
  apiBasePath: string;

  authMode: "oidc" | "local";
  jwtSecret?: string;

  redisUrl?: string;

  controlDatabaseUrl: string;
  postgresAdminUrl?: string;
  tenantDsnEncryptionKey?: string;
  platformAdminKey?: string;

  // Platform operator OIDC (protects /api/admin/* and the /admin UI)
  platformOidcIssuer?: string;
  platformOidcAudience?: string;
  platformOidcClientId?: string;
  platformOidcScopes: string;
  platformOidcRoleClaimPath: string;
  platformOidcRoleMapping: Record<string, string>;

  distributionRequireApproval: boolean;
};

export function getConfig(): ApiConfig {
  const port = Number(process.env.PORT ?? "3001");
  const host = process.env.HOST ?? "0.0.0.0";

  const controlDatabaseUrl = process.env.CONTROL_DATABASE_URL ?? "";
  if (!controlDatabaseUrl) throw new Error("CONTROL_DATABASE_URL is required");

  const authMode = (process.env.AUTH_MODE ?? "oidc").toLowerCase() as ApiConfig["authMode"];
  if (authMode !== "oidc" && authMode !== "local") throw new Error("AUTH_MODE must be oidc|local");

  const jwtSecret = process.env.JWT_SECRET ?? "";
  if (authMode === "local" && !jwtSecret) throw new Error("JWT_SECRET is required for AUTH_MODE=local");

  const platformOidcIssuer = (process.env.PLATFORM_OIDC_ISSUER ?? "").trim() || undefined;
  const platformOidcClientId = (process.env.PLATFORM_OIDC_CLIENT_ID ?? "").trim() || undefined;
  const platformOidcAudience =
    (process.env.PLATFORM_OIDC_AUDIENCE ?? "").trim() || platformOidcClientId || undefined;
  const platformOidcScopes = (process.env.PLATFORM_OIDC_SCOPES ?? "").trim() || "openid profile email";
  const platformOidcRoleClaimPath = (process.env.PLATFORM_OIDC_ROLE_CLAIM_PATH ?? "").trim() || "roles";

  const platformOidcRoleMappingRaw = (process.env.PLATFORM_OIDC_ROLE_MAPPING ?? "").trim();
  let platformOidcRoleMapping: Record<string, string> = {};
  if (platformOidcRoleMappingRaw) {
    try {
      const parsed = JSON.parse(platformOidcRoleMappingRaw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("PLATFORM_OIDC_ROLE_MAPPING must be a JSON object");
      }
      platformOidcRoleMapping = Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
      );
    } catch (e) {
      throw new Error(`Invalid PLATFORM_OIDC_ROLE_MAPPING JSON: ${String((e as any)?.message ?? e)}`);
    }
  }

  return {
    port,
    host,
    apiBasePath: process.env.API_BASE_PATH ?? "/api",

    authMode,
    jwtSecret: jwtSecret || undefined,

    redisUrl: process.env.REDIS_URL,

    controlDatabaseUrl,
    postgresAdminUrl: process.env.POSTGRES_ADMIN_URL,
    tenantDsnEncryptionKey: process.env.TENANT_DSN_ENCRYPTION_KEY,
    platformAdminKey: process.env.PLATFORM_ADMIN_KEY,

    platformOidcIssuer,
    platformOidcAudience,
    platformOidcClientId,
    platformOidcScopes,
    platformOidcRoleClaimPath,
    platformOidcRoleMapping,

    distributionRequireApproval: (process.env.DISTRIBUTION_REQUIRE_APPROVAL ?? "true") !== "false",
  };
}
