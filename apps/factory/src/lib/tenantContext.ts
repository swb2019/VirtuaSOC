import { env, requireEnv } from "@/env";
import { prismaControl } from "@/lib/prismaControl";
import { requireTenantContext, type TenantRole } from "@/lib/rbac";
import { decryptString } from "@/lib/crypto";
import { tenantDb } from "@/lib/tenantDb";

export async function requireTenantDb(minRole: TenantRole = "VIEWER") {
  const ctx = await requireTenantContext(minRole);
  const control = prismaControl();

  const cred = await control.tenantDbCredential.findUnique({
    where: { tenantId: ctx.tenant.id },
  });
  if (!cred?.encryptedDsn) {
    throw new Error("Tenant DB credentials missing");
  }

  const key = requireEnv("TENANT_DSN_ENCRYPTION_KEY", env.tenantDsnEncryptionKey);
  const dsn = decryptString(key, cred.encryptedDsn);

  const db = tenantDb(dsn);
  return { ...ctx, tenantDb: db, tenantDsn: dsn };
}


