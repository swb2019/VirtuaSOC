import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),

  FEATURE_FACTORY_APP: z.string().optional(),
  FEATURE_RBAC: z.string().optional(),
  FEATURE_EVIDENCE_INGEST: z.string().optional(),
  FEATURE_ENTITY_LINKING: z.string().optional(),
  FEATURE_SIGNALS: z.string().optional(),
  FEATURE_PRODUCT_FACTORY: z.string().optional(),
  FEATURE_REVIEW_DISTRIBUTION: z.string().optional(),

  // Control-plane Postgres (tenants + NextAuth + RBAC)
  CONTROL_DATABASE_URL: z.string().optional(),

  // Redis (BullMQ jobs)
  REDIS_URL: z.string().optional(),

  // DB-per-tenant DSN encryption (used to decrypt TenantDbCredential.encryptedDsn)
  TENANT_DSN_ENCRYPTION_KEY: z.string().optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Microsoft Entra (Azure AD)
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),
  ENTRA_TENANT_ID: z.string().optional(),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV ?? "development",
  featureFactoryApp: (parsed.FEATURE_FACTORY_APP ?? "false").toLowerCase() === "true",
  featureRbac: (parsed.FEATURE_RBAC ?? "false").toLowerCase() === "true",
  featureEvidenceIngest: (parsed.FEATURE_EVIDENCE_INGEST ?? "false").toLowerCase() === "true",
  featureEntityLinking: (parsed.FEATURE_ENTITY_LINKING ?? "false").toLowerCase() === "true",
  featureSignals: (parsed.FEATURE_SIGNALS ?? "false").toLowerCase() === "true",
  featureProductFactory: (parsed.FEATURE_PRODUCT_FACTORY ?? "false").toLowerCase() === "true",
  featureReviewDistribution: (parsed.FEATURE_REVIEW_DISTRIBUTION ?? "false").toLowerCase() === "true",

  controlDatabaseUrl: parsed.CONTROL_DATABASE_URL ?? "",
  redisUrl: parsed.REDIS_URL ?? "",
  tenantDsnEncryptionKey: parsed.TENANT_DSN_ENCRYPTION_KEY ?? "",

  nextAuthUrl: parsed.NEXTAUTH_URL ?? "",
  nextAuthSecret: parsed.NEXTAUTH_SECRET ?? "",

  entraClientId: parsed.ENTRA_CLIENT_ID ?? "",
  entraClientSecret: parsed.ENTRA_CLIENT_SECRET ?? "",
  entraTenantId: parsed.ENTRA_TENANT_ID ?? "",
};

export function requireEnv(name: string, value: string): string {
  if (!value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}


