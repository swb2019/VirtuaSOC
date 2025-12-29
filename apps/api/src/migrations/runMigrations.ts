import { fileURLToPath } from "node:url";

import { runSqlMigrations } from "./migrator.js";

const mode = (process.env.MIGRATION_MODE ?? "tenant").toLowerCase();
const databaseUrl =
  mode === "control" ? process.env.CONTROL_DATABASE_URL ?? "" : process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  throw new Error(mode === "control" ? "CONTROL_DATABASE_URL is required" : "DATABASE_URL is required");
}

const migrationsDir = fileURLToPath(
  new URL(mode === "control" ? "../../migrations-control/" : "../../migrations-tenant/", import.meta.url),
);

await runSqlMigrations(databaseUrl, migrationsDir);

// eslint-disable-next-line no-console
console.log("Migrations complete.");
