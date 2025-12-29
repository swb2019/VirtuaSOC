import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";

import { createDb } from "../db.js";
import { getConfig } from "../config.js";

const config = getConfig();
const controlDb = createDb(config.controlDatabaseUrl);

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@virtuasoc.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin";

async function ensurePlatformAdminUser() {
  const existing = await controlDb<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${adminEmail}
  `;
  if (existing.length) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await controlDb`
    INSERT INTO users (id, email, display_name, role, password_hash)
    VALUES (${randomUUID()}, ${adminEmail}, ${"Platform Admin"}, ${"admin"}, ${passwordHash})
  `;
}

async function main() {
  await ensurePlatformAdminUser();
  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log(`Admin email: ${adminEmail}`);
  // eslint-disable-next-line no-console
  console.log(`Admin password: ${adminPassword}`);
  await controlDb.end({ timeout: 5 });
}

await main();
