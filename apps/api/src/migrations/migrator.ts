import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import postgres from "postgres";

export async function runSqlMigrations(databaseUrl: string, migrationsDir: string) {
  const sql = postgres(databaseUrl, { max: 2, idle_timeout: 10 });

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
    console.log(`Applying migration: ${file}`);

    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`
        INSERT INTO schema_migrations(name) VALUES (${file})
        ON CONFLICT DO NOTHING
      `;
    });
  }

  await sql.end({ timeout: 5 });
}


