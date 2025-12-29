import type { Db } from "../db.js";

import { decryptString } from "./crypto.js";

export type TenantRecord = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
};

export type TenantAuthProvider = {
  tenantId: string;
  issuer: string;
  clientId: string;
  scopes: string;
  roleClaimPath: string;
  roleMapping: Record<string, string>;
};

export async function listTenants(controlDb: Db): Promise<TenantRecord[]> {
  const rows = await controlDb<
    { id: string; slug: string; name: string; created_at: string }[]
  >`SELECT id, slug, name, created_at FROM tenants ORDER BY created_at DESC`;
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, createdAt: r.created_at }));
}

export async function getTenantBySlug(controlDb: Db, slug: string): Promise<TenantRecord | null> {
  const rows = await controlDb<
    { id: string; slug: string; name: string; created_at: string }[]
  >`SELECT id, slug, name, created_at FROM tenants WHERE slug = ${slug}`;
  if (!rows.length) return null;
  const r = rows[0]!;
  return { id: r.id, slug: r.slug, name: r.name, createdAt: r.created_at };
}

export async function getTenantAuthProvider(
  controlDb: Db,
  tenantId: string,
): Promise<TenantAuthProvider | null> {
  const rows = await controlDb<
    {
      tenant_id: string;
      issuer: string;
      client_id: string;
      scopes: string;
      role_claim_path: string;
      role_mapping: Record<string, string>;
    }[]
  >`
    SELECT tenant_id, issuer, client_id, scopes, role_claim_path, role_mapping
    FROM tenant_auth_providers
    WHERE tenant_id = ${tenantId}
  `;
  if (!rows.length) return null;
  const r = rows[0]!;
  return {
    tenantId: r.tenant_id,
    issuer: r.issuer,
    clientId: r.client_id,
    scopes: r.scopes,
    roleClaimPath: r.role_claim_path,
    roleMapping: r.role_mapping ?? {},
  };
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


