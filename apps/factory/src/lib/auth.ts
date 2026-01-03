import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { randomBytes } from "node:crypto";

import { env, requireEnv } from "../env";
import { prismaControl } from "./prismaControl";

function randomTokenBase64Url(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function tryParseTenantIdFromIssuer(issuer: string): string | null {
  const raw = (issuer ?? "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Common Entra issuer forms:
    // - https://login.microsoftonline.com/<tenantId>/v2.0
    // - https://login.microsoftonline.com/<tenantId>/
    const parts = u.pathname.split("/").filter(Boolean);
    const candidate = parts[0] ?? "";
    if (!candidate) return null;
    // UUID-ish tenant id
    if (/^[0-9a-fA-F-]{32,36}$/.test(candidate)) return candidate;
    // Entra special tenants (common/organizations/consumers) are also valid.
    if (candidate === "common" || candidate === "organizations" || candidate === "consumers") return candidate;
    return null;
  } catch {
    return null;
  }
}

async function acceptInvitationByEmail(db: ReturnType<typeof prismaControl>, userId: string, email: string) {
  const inv = await db.invitation.findFirst({
    where: {
      email: email.toLowerCase(),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!inv) return null;

  await db.membership.upsert({
    where: { tenantId_userId: { tenantId: inv.tenantId, userId } },
    create: { tenantId: inv.tenantId, userId, role: inv.role },
    update: { role: inv.role },
  });

  await db.invitation.update({
    where: { id: inv.id },
    data: { acceptedAt: new Date() },
  });

  return inv;
}

export function getAuthOptions(): NextAuthOptions {
  const db = prismaControl();

  // Prefer dedicated Factory Entra app (ENTRA_*), but allow fallback to existing Platform OIDC public client.
  // This unblocks programmatic deployments where platform OIDC is already configured, but Entra secrets are not.
  const clientId = env.entraClientId.trim() || env.platformOidcClientId.trim();
  const tenantId = env.entraTenantId.trim() || tryParseTenantIdFromIssuer(env.platformOidcIssuer) || "";
  const clientSecret = env.entraClientSecret.trim() || "";
  const publicClient = !clientSecret;

  return {
    adapter: PrismaAdapter(db),
    session: { strategy: "database" },
    providers: [
      AzureADProvider({
        clientId: requireEnv("ENTRA_CLIENT_ID", clientId),
        // NextAuth's provider typing requires a string clientSecret, but Entra can operate as a public (PKCE) client.
        // When ENTRA_CLIENT_SECRET is not set, we force token_endpoint_auth_method=none so no secret is used.
        clientSecret: clientSecret || "unused",
        tenantId: requireEnv("ENTRA_TENANT_ID", tenantId),
        ...(publicClient
          ? {
              client: { token_endpoint_auth_method: "none" },
              checks: ["pkce", "state"],
            }
          : {}),
      }),
    ],
    secret: requireEnv("NEXTAUTH_SECRET", env.nextAuthSecret),
    callbacks: {
      async signIn({ user }) {
        if (!env.featureFactoryApp || !env.featureRbac) return false;

        const email = normalizeEmail(user?.email);
        if (!email) return false;

        // 1) If the user already has membership (by email), allow.
        const existing = await db.membership.findFirst({ where: { user: { email } } });
        if (existing) return true;

        // 2) If there is a pending invitation matching email, allow.
        // Membership creation + acceptance happens in events.signIn (after NextAuth has persisted the user).
        const pendingInvite = await db.invitation.findFirst({
          where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
        });
        if (pendingInvite) return true;

        // 3) Bootstrap: if Factory has no memberships yet, allow the first user.
        const membershipCount = await db.membership.count();
        if (membershipCount === 0) return true;

        // 4) Otherwise, deny sign-in (must be invited by a tenant admin).
        return false;
      },
      async session({ session, user }) {
        if (session.user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).id = user.id;
        }
        return session;
      },
    },
    events: {
      async signIn({ user }) {
        if (!env.featureFactoryApp || !env.featureRbac) return;

        const email = normalizeEmail(user?.email);
        if (!email) return;

        // Use the persisted DB user (UUID) to avoid mismatches with provider profile ids.
        const dbUser = await db.user.findUnique({ where: { email } });
        if (!dbUser) return;
        const userId = dbUser.id;

        // If membership already exists, nothing to do.
        const existing = await db.membership.findFirst({ where: { userId } });
        if (existing) return;

        // If invited, accept + create membership.
        const accepted = await acceptInvitationByEmail(db, userId, email);
        if (accepted) return;

        // Bootstrap: if Factory has no memberships yet, grant ADMIN to the first user.
        const membershipCount = await db.membership.count();
        if (membershipCount !== 0) return;

        const tenantCount = await db.tenant.count();
        if (tenantCount === 0) {
          const tenant = await db.tenant.create({ data: { slug: "demo", name: "Demo" } });
          await db.membership.create({ data: { tenantId: tenant.id, userId, role: "ADMIN" } });
          return;
        }

        const firstTenant = await db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
        if (!firstTenant) return;
        await db.membership.create({ data: { tenantId: firstTenant.id, userId, role: "ADMIN" } });
      },
    },
  };
}


