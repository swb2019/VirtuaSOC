import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import type { FastifyPluginAsync } from "fastify";

import { verifyPlatformOidcToken, type PlatformAuthUser } from "../auth/platformOidc.js";
import { runSqlMigrations } from "../migrations/migrator.js";
import { encryptString } from "../tenancy/crypto.js";
import { provisionTenantDb } from "../tenancy/provisionTenantDb.js";
import { assertTenantSlug } from "../util/ident.js";
import { getTenantAuthProvider, listTenants } from "../tenancy/controlPlane.js";

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

type UpdateTenantBody = {
  name?: string;
  oidc?:
    | {
        issuer: string;
        clientId: string;
        scopes?: string;
        roleClaimPath?: string;
        roleMapping?: Record<string, string>;
      }
    | null;
};

type AdminTokenBody = {
  sub?: string;
  role?: "viewer" | "gsoc_analyst" | "gsoc_lead" | "admin";
};

declare module "fastify" {
  interface FastifyRequest {
    platformUser?: PlatformAuthUser;
  }
}

export const adminTenantsRoutes: FastifyPluginAsync = async (app) => {
  const { config, controlDb } = app;

  // Public endpoint for the /admin UI to begin platform OIDC login (PKCE).
  app.get("/admin/auth/oidc/config", async (_req, reply) => {
    if (!config.platformOidcIssuer || !config.platformOidcClientId) {
      return reply.code(501).send({ error: "Platform OIDC not configured" });
    }

    return {
      issuer: config.platformOidcIssuer,
      clientId: config.platformOidcClientId,
      scopes: config.platformOidcScopes,
      roleClaimPath: config.platformOidcRoleClaimPath,
    };
  });

  app.addHook("onRequest", async (req, reply) => {
    // 1) Break-glass: allow PLATFORM_ADMIN_KEY (server-side) if present.
    const providedKey = String(req.headers["x-platform-admin-key"] ?? "");
    if (config.platformAdminKey && providedKey && providedKey === config.platformAdminKey) {
      return;
    }

    // 2) Preferred: platform operator OIDC (Authorization: Bearer <token>)
    const platformOidcEnabled = Boolean(config.platformOidcIssuer && config.platformOidcAudience);
    if (platformOidcEnabled) {
      const authz = String(req.headers.authorization ?? "");
      if (!authz.startsWith("Bearer ")) return reply.code(401).send({ error: "Missing bearer token" });
      const token = authz.slice("Bearer ".length).trim();
      if (!token) return reply.code(401).send({ error: "Missing bearer token" });

      try {
        const user = await verifyPlatformOidcToken(token, {
          issuer: config.platformOidcIssuer!,
          audience: config.platformOidcAudience,
          roleClaimPath: config.platformOidcRoleClaimPath,
          roleMapping: config.platformOidcRoleMapping,
        });

        if (user.role !== "admin") return reply.code(403).send({ error: "Forbidden" });
        req.platformUser = user;
        return;
      } catch (err) {
        req.log.warn({ err }, "Platform OIDC token verification failed");
        return reply.code(401).send({ error: "Invalid token" });
      }
    }

    // 3) If platform OIDC is not configured, require PLATFORM_ADMIN_KEY (break-glass only).
    if (!config.platformAdminKey) {
      return reply.code(501).send({ error: "PLATFORM_ADMIN_KEY not configured" });
    }
    return reply.code(401).send({ error: "Unauthorized" });
  });

  app.get("/admin/tenants", async () => {
    return { tenants: await listTenants(controlDb) };
  });

  app.get<{ Params: { id: string } }>("/admin/tenants/:id", async (req, reply) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "id is required" });

    const rows = await controlDb<{ id: string; slug: string; name: string; created_at: string }[]>`
      SELECT id, slug, name, created_at
      FROM tenants
      WHERE id = ${id}
    `;
    if (!rows.length) return reply.code(404).send({ error: "Not found" });
    const t = rows[0]!;

    const provider = await getTenantAuthProvider(controlDb, t.id);

    return {
      tenant: { id: t.id, slug: t.slug, name: t.name, createdAt: t.created_at },
      oidc: provider
        ? {
            issuer: provider.issuer,
            clientId: provider.clientId,
            scopes: provider.scopes,
            roleClaimPath: provider.roleClaimPath,
            roleMapping: provider.roleMapping ?? {},
          }
        : null,
    };
  });

  // Break-glass token issuance for AUTH_MODE=local.
  // Protected by X-Platform-Admin-Key.
  app.post<{ Body: AdminTokenBody }>("/admin/token", async (req, reply) => {
    if (config.authMode !== "local") {
      return reply.code(501).send({ error: "AUTH_MODE is not local" });
    }

    // fastify-jwt is registered only in AUTH_MODE=local.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signer = (app as any).jwt;
    if (!signer?.sign) return reply.code(500).send({ error: "JWT signing not available" });

    const sub = String(req.body?.sub ?? "platform-admin").trim() || "platform-admin";
    const role = (req.body?.role ?? "admin") as AdminTokenBody["role"];
    const allowed = role === "viewer" || role === "gsoc_analyst" || role === "gsoc_lead" || role === "admin";
    if (!allowed) return reply.code(400).send({ error: "Invalid role" });

    const token = signer.sign({ sub, role });
    return { token };
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
    // NOTE: tsup bundles to dist/index.js, so import.meta.url-relative paths point to /repo/apps/*.
    // Use process.cwd()-relative path instead (stable in our Docker images where WORKDIR=/repo).
    const tenantMigrationsDir = resolve(process.cwd(), "apps/api/migrations-tenant");
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

  app.put<{ Params: { id: string }; Body: UpdateTenantBody }>("/admin/tenants/:id", async (req, reply) => {
    const tenantId = String(req.params.id ?? "").trim();
    if (!tenantId) return reply.code(400).send({ error: "id is required" });

    const exists = await controlDb<{ ok: number }[]>`SELECT 1 as ok FROM tenants WHERE id = ${tenantId}`;
    if (!exists.length) return reply.code(404).send({ error: "Not found" });

    const nameRaw = req.body?.name;
    const name = typeof nameRaw === "string" ? nameRaw.trim() : undefined;
    if (name !== undefined && !name) return reply.code(400).send({ error: "name must be non-empty" });

    const oidc = req.body?.oidc;
    const oidcIssuer = oidc && typeof oidc === "object" ? String((oidc as any).issuer ?? "").trim() : undefined;
    const oidcClientId = oidc && typeof oidc === "object" ? String((oidc as any).clientId ?? "").trim() : undefined;
    const oidcScopes = oidc && typeof oidc === "object" ? String((oidc as any).scopes ?? "").trim() : undefined;
    const oidcRoleClaimPath =
      oidc && typeof oidc === "object" ? String((oidc as any).roleClaimPath ?? "").trim() : undefined;
    const oidcRoleMappingRaw = oidc && typeof oidc === "object" ? (oidc as any).roleMapping : undefined;

    if (oidc !== undefined && oidc !== null) {
      if (!oidcIssuer) return reply.code(400).send({ error: "oidc.issuer is required" });
      if (!oidcClientId) return reply.code(400).send({ error: "oidc.clientId is required" });
      if (oidcRoleMappingRaw != null && (typeof oidcRoleMappingRaw !== "object" || Array.isArray(oidcRoleMappingRaw))) {
        return reply.code(400).send({ error: "oidc.roleMapping must be an object" });
      }
    }

    await controlDb.begin(async (tx) => {
      if (name !== undefined) {
        await tx`UPDATE tenants SET name = ${name} WHERE id = ${tenantId}`;
      }

      if (oidc === undefined) return;

      if (oidc === null) {
        await tx`DELETE FROM tenant_auth_providers WHERE tenant_id = ${tenantId}`;
        return;
      }

      const issuer = oidcIssuer!;
      const clientId = oidcClientId!;
      const scopes = oidcScopes || "openid profile email";
      const roleClaimPath = oidcRoleClaimPath || "groups";
      const roleMapping = (oidcRoleMappingRaw as Record<string, string> | undefined) ?? {};

      const existing = await tx<{ id: string }[]>`
        SELECT id FROM tenant_auth_providers WHERE tenant_id = ${tenantId}
      `;
      if (!existing.length) {
        await tx`
          INSERT INTO tenant_auth_providers (
            id, tenant_id, issuer, client_id, scopes, role_claim_path, role_mapping
          ) VALUES (
            ${randomUUID()}, ${tenantId}, ${issuer}, ${clientId}, ${scopes}, ${roleClaimPath}, ${tx.json(roleMapping)}
          )
        `;
      } else {
        await tx`
          UPDATE tenant_auth_providers
          SET issuer = ${issuer},
              client_id = ${clientId},
              scopes = ${scopes},
              role_claim_path = ${roleClaimPath},
              role_mapping = ${tx.json(roleMapping)}
          WHERE tenant_id = ${tenantId}
        `;
      }
    });

    const rows = await controlDb<{ id: string; slug: string; name: string; created_at: string }[]>`
      SELECT id, slug, name, created_at
      FROM tenants
      WHERE id = ${tenantId}
    `;
    const t = rows[0]!;
    const provider = await getTenantAuthProvider(controlDb, tenantId);

    return {
      tenant: { id: t.id, slug: t.slug, name: t.name, createdAt: t.created_at },
      oidc: provider
        ? {
            issuer: provider.issuer,
            clientId: provider.clientId,
            scopes: provider.scopes,
            roleClaimPath: provider.roleClaimPath,
            roleMapping: provider.roleMapping ?? {},
          }
        : null,
    };
  });
};


