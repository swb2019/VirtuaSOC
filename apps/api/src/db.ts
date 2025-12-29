import postgres from "postgres";

export type Db = postgres.Sql;

export function createDb(databaseUrl: string): Db {
  return postgres(databaseUrl, { max: 10, idle_timeout: 20 });
}
