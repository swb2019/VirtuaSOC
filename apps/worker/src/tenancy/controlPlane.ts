import type { Db } from "../db.js";

import { decryptString } from "./crypto.js";

export type TenantRecord = {
  id: string;
  slug: string;
  name: string;
};

export async function listTenants(controlDb: Db): Promise<TenantRecord[]> {
  const rows = await controlDb<{ id: string; slug: string; name: string }[]>`
    SELECT id, slug, name FROM tenants ORDER BY created_at DESC
  `;
  return rows;
}

export async function getTenantDbDsn(controlDb: Db, tenantId: string, encryptionKey: string): Promise<string> {
  const rows = await controlDb<{ encrypted_dsn: string }[]>`
    SELECT encrypted_dsn
    FROM tenant_db_credentials
    WHERE tenant_id = ${tenantId}
  `;
  if (!rows.length) throw new Error("Tenant DB credentials not found");
  return decryptString(encryptionKey, rows[0]!.encrypted_dsn);
}


