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

  // AI Setup Assistant (OpenAI)
  aiSetupEnabled: boolean;
  openAiApiKey?: string;
  openAiModel: string;
  aiSetupMaxToolCalls: number;
  aiSetupMaxOutputTokens: number;
  aiSetupMaxRequestsPerTenantPerDay: number;
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

  const aiSetupEnabled = (process.env.AI_SETUP_ENABLED ?? "").trim().toLowerCase() === "true";
  const openAiApiKey = (process.env.OPENAI_API_KEY ?? "").trim() || undefined;
  const openAiModel = (process.env.OPENAI_MODEL ?? "").trim() || "gpt-5.2";
  const aiSetupMaxToolCalls = Math.max(
    0,
    Math.min(20, Number(process.env.AI_SETUP_MAX_TOOL_CALLS ?? "5") || 5),
  );
  const aiSetupMaxOutputTokens = Math.max(
    64,
    Math.min(2000, Number(process.env.AI_SETUP_MAX_OUTPUT_TOKENS ?? "600") || 600),
  );
  const aiSetupMaxRequestsPerTenantPerDay = Math.max(
    1,
    Math.min(500, Number(process.env.AI_SETUP_MAX_REQUESTS_PER_TENANT_PER_DAY ?? "50") || 50),
  );

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

    aiSetupEnabled,
    openAiApiKey,
    openAiModel,
    aiSetupMaxToolCalls,
    aiSetupMaxOutputTokens,
    aiSetupMaxRequestsPerTenantPerDay,
  };
}
