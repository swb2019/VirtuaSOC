import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import type { FastifyPluginAsync } from "fastify";

import { runSqlMigrations } from "../migrations/migrator.js";
import { encryptString } from "../tenancy/crypto.js";
import { provisionTenantDb } from "../tenancy/provisionTenantDb.js";
import { assertTenantSlug } from "../util/ident.js";
import { listTenants } from "../tenancy/controlPlane.js";

type CreateTenantBody = {
  slug: string;
  name: string;
  oidc?: {
    issuer: string;
    clientId: string;
    scopes?: string;
    roleClaimPath?: string;
    roleMapping?: Record<string, string>;
  };
};

export const adminTenantsRoutes: FastifyPluginAsync = async (app) => {
  const { config, controlDb } = app;

  app.addHook("onRequest", async (req, reply) => {
    const provided = String(req.headers["x-platform-admin-key"] ?? "");
    if (!config.platformAdminKey) {
      return reply.code(501).send({ error: "PLATFORM_ADMIN_KEY not configured" });
    }
    if (!provided || provided !== config.platformAdminKey) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.get("/admin/tenants", async () => {
    return { tenants: await listTenants(controlDb) };
  });

  app.post<{ Body: CreateTenantBody }>("/admin/tenants", async (req, reply) => {
    if (!config.postgresAdminUrl) {
      return reply.code(501).send({ error: "POSTGRES_ADMIN_URL not configured" });
    }
    if (!config.tenantDsnEncryptionKey) {
      return reply.code(501).send({ error: "TENANT_DSN_ENCRYPTION_KEY not configured" });
    }

    const slug = assertTenantSlug(req.body.slug);
    const name = String(req.body.name ?? "").trim();
    if (!name) return reply.code(400).send({ error: "name is required" });

    const existing = await controlDb<{ id: string }[]>`SELECT id FROM tenants WHERE slug = ${slug}`;
    if (existing.length) return reply.code(409).send({ error: "tenant already exists" });

    const tenantId = randomUUID();

    // Provision tenant DB + run tenant migrations
    const provisioned = await provisionTenantDb(config.postgresAdminUrl, slug);
    const tenantMigrationsDir = fileURLToPath(new URL("../../migrations-tenant/", import.meta.url));
    await runSqlMigrations(provisioned.dsn, tenantMigrationsDir);

    const encryptedDsn = encryptString(config.tenantDsnEncryptionKey, provisioned.dsn);

    await controlDb.begin(async (tx) => {
      await tx`
        INSERT INTO tenants (id, slug, name)
        VALUES (${tenantId}, ${slug}, ${name})
      `;

      await tx`
        INSERT INTO tenant_db_credentials (id, tenant_id, encrypted_dsn, db_name, db_user)
        VALUES (${randomUUID()}, ${tenantId}, ${encryptedDsn}, ${provisioned.dbName}, ${provisioned.dbUser})
      `;

      if (req.body.oidc?.issuer && req.body.oidc?.clientId) {
        const scopes = req.body.oidc.scopes ?? "openid profile email";
        const roleClaimPath = req.body.oidc.roleClaimPath ?? "groups";
        const roleMapping = req.body.oidc.roleMapping ?? {};

        await tx`
          INSERT INTO tenant_auth_providers (
            id, tenant_id, issuer, client_id, scopes, role_claim_path, role_mapping
          ) VALUES (
            ${randomUUID()},
            ${tenantId},
            ${req.body.oidc.issuer},
            ${req.body.oidc.clientId},
            ${scopes},
            ${roleClaimPath},
            ${tx.json(roleMapping)}
          )
        `;
      }
    });

    return reply.code(201).send({
      tenant: {
        id: tenantId,
        slug,
        name,
        dbName: provisioned.dbName,
        dbUser: provisioned.dbUser,
      },
    });
  });
};


