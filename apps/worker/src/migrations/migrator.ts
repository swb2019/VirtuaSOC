import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import postgres from "postgres";

// Advisory locks are per-database, so a single stable key is enough.
const MIGRATION_LOCK_ID = 88421701;

export async function runSqlMigrations(databaseUrl: string, migrationsDir: string) {
  // max=1 ensures a single connection is used for the whole migrator,
  // which makes advisory locking reliable.
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 10 });

  try {
    await sql/* sql */ `SELECT pg_advisory_lock(${MIGRATION_LOCK_ID});`;

    await sql/* sql */ `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const applied = await sql<{ name: string }[]>`
        SELECT name FROM schema_migrations WHERE name = ${file}
      `;
      if (applied.length) continue;

      const text = await readFile(join(migrationsDir, file), "utf8");
      // eslint-disable-next-line no-console
      console.log(`[worker] applying tenant migration: ${file}`);

      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`
          INSERT INTO schema_migrations(name) VALUES (${file})
          ON CONFLICT DO NOTHING
        `;
      });
    }
  } finally {
    try {
      await sql/* sql */ `SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID});`;
    } catch {
      // ignore unlock errors
    }
    await sql.end({ timeout: 5 });
  }
}


