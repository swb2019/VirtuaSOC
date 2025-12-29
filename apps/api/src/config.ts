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

    distributionRequireApproval: (process.env.DISTRIBUTION_REQUIRE_APPROVAL ?? "true") !== "false",
  };
}
