import postgres from "postgres";

import { assertSqlIdentifier, assertTenantSlug, quoteIdent } from "../util/ident.js";
import { randomSecretBase64Url } from "../util/randomSecret.js";

export type ProvisionedTenantDb = {
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dsn: string;
};

function makeDbName(slug: string) {
  // 63 char identifier max; keep it short/predictable
  const base = `vsoc_${slug.replace(/-/g, "_")}`;
  return assertSqlIdentifier(base.slice(0, 63));
}

function makeDbUser(slug: string) {
  const base = `vsoc_${slug.replace(/-/g, "_")}`;
  return assertSqlIdentifier(base.slice(0, 63));
}

function quoteLiteral(value: string): string {
  // Minimal SQL literal quoting for generated secrets.
  // (We still keep identifiers separately validated/quoted via quoteIdent.)
  return `'${value.replace(/'/g, "''")}'`;
}

export async function provisionTenantDb(postgresAdminUrl: string, tenantSlug: string): Promise<ProvisionedTenantDb> {
  const slug = assertTenantSlug(tenantSlug);

  const dbName = makeDbName(slug);
  const dbUser = makeDbUser(slug);
  const dbPassword = randomSecretBase64Url(24);

  const admin = postgres(postgresAdminUrl, { max: 2, idle_timeout: 10 });

  // Create role if missing
  const roleExists = await admin<{ ok: number }[]>`
    SELECT 1 as ok FROM pg_roles WHERE rolname = ${dbUser}
  `;
  if (!roleExists.length) {
    await admin.unsafe(
      `CREATE ROLE ${quoteIdent(dbUser)} WITH LOGIN PASSWORD ${quoteLiteral(dbPassword)}`,
    );
  } else {
    // If the role already exists (e.g., a previous onboarding attempt failed after creating it),
    // rotate/reset the password so the returned DSN actually works.
    await admin.unsafe(
      `ALTER ROLE ${quoteIdent(dbUser)} WITH PASSWORD ${quoteLiteral(dbPassword)}`,
    );
  }

  // Create database if missing
  const dbExists = await admin<{ ok: number }[]>`
    SELECT 1 as ok FROM pg_database WHERE datname = ${dbName}
  `;
  if (!dbExists.length) {
    await admin.unsafe(`CREATE DATABASE ${quoteIdent(dbName)} OWNER ${quoteIdent(dbUser)}`);
  }

  await admin.end({ timeout: 5 });

  const baseUrl = new URL(postgresAdminUrl);
  baseUrl.username = dbUser;
  baseUrl.password = dbPassword;
  baseUrl.pathname = `/${dbName}`;

  return { dbName, dbUser, dbPassword, dsn: baseUrl.toString() };
}


