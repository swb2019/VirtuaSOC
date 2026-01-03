import { createDecipheriv } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import postgres from "postgres";

const MIGRATION_LOCK_ID = 88421701;

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith("--")) return null;
  return next;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function decodeKey(key) {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) throw new Error("TENANT_DSN_ENCRYPTION_KEY is required");

  const isHex = /^[0-9a-f]+$/i.test(trimmed) && trimmed.length % 2 === 0;
  const buf = isHex ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "base64");
  if (buf.length !== 32) throw new Error("TENANT_DSN_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  return buf;
}

function decryptString(encryptionKey, encrypted) {
  const key = decodeKey(encryptionKey);
  const parts = String(encrypted ?? "").split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");

  const [ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

async function runSqlMigrations(databaseUrl, migrationsDir) {
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 10 });
  try {
    await sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID});`;
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const applied = await sql`SELECT name FROM schema_migrations WHERE name = ${file}`;
      if (applied.length) continue;
      const text = await readFile(join(migrationsDir, file), "utf8");
      // eslint-disable-next-line no-console
      console.log(`[smoke] applying migration: ${file}`);
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`INSERT INTO schema_migrations(name) VALUES (${file}) ON CONFLICT DO NOTHING`;
      });
    }
  } finally {
    try {
      await sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID});`;
    } catch {}
    await sql.end({ timeout: 5 });
  }
}

const slug = (argValue("--tenant") ?? process.env.TENANT_SLUG ?? "demo").trim().toLowerCase();
const doMigrate = hasFlag("--migrate") || String(process.env.MIGRATE ?? "").toLowerCase() === "true";

const controlUrl = String(process.env.CONTROL_DATABASE_URL ?? "").trim();
const key = String(process.env.TENANT_DSN_ENCRYPTION_KEY ?? "").trim();

if (!controlUrl) throw new Error("CONTROL_DATABASE_URL is required");
if (!slug) throw new Error("TENANT_SLUG is required");

const control = postgres(controlUrl, { max: 1, idle_timeout: 10 });
const tenants = await control`SELECT id, slug, name FROM tenants WHERE slug = ${slug} LIMIT 1`;
if (!tenants.length) throw new Error(`Tenant not found: ${slug}`);
const tenantId = tenants[0].id;

const creds = await control`SELECT encrypted_dsn FROM tenant_db_credentials WHERE tenant_id = ${tenantId} LIMIT 1`;
if (!creds.length) throw new Error(`Tenant DB credentials not found for tenant: ${slug}`);
const dsn = decryptString(key, creds[0].encrypted_dsn);
await control.end({ timeout: 5 });

const migrationsDir = resolve(process.cwd(), "apps/api/migrations-tenant");
if (doMigrate) {
  await runSqlMigrations(dsn, migrationsDir);
}

const tenantDb = postgres(dsn, { max: 1, idle_timeout: 10 });
const required = [
  "schema_migrations",
  "evidence_items",
  "rss_feeds",
  "entities",
  "signals",
  "product_configs",
  "products",
  "audit_log",
];

const checks = await tenantDb`
  SELECT relname
  FROM pg_class
  WHERE relkind = 'r'
    AND relnamespace = 'public'::regnamespace
    AND relname = ANY(${tenantDb.array(required, 25)})
`;
const present = new Set(checks.map((r) => String(r.relname)));
const missing = required.filter((t) => !present.has(t));

const mig = await tenantDb`SELECT count(*)::int as count, max(applied_at) as last_applied_at FROM schema_migrations`;
await tenantDb.end({ timeout: 5 });

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ok: missing.length === 0,
      tenant: { slug, id: tenantId },
      schemaMigrations: mig[0] ?? null,
      missingTables: missing,
    },
    null,
    2,
  ),
);

process.exit(missing.length === 0 ? 0 : 2);


