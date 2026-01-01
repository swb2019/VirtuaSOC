import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env, requireEnv } from "../env";
import { prismaControl } from "./prismaControl";

async function ensureDefaultTenant(userId: string) {
  // Bootstrap: ensure a demo tenant exists and the signed-in user has membership.
  const db = prismaControl();
  const tenant = await db.tenant.upsert({
    where: { slug: "demo" },
    create: { slug: "demo", name: "Demo" },
    update: {},
  });

  await db.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    create: { tenantId: tenant.id, userId, role: "ADMIN" },
    update: {},
  });

  return tenant;
}

export function getAuthOptions(): NextAuthOptions {
  const db = prismaControl();
  return {
    adapter: PrismaAdapter(db),
    session: { strategy: "database" },
    providers: [
      AzureADProvider({
        clientId: requireEnv("ENTRA_CLIENT_ID", env.entraClientId),
        clientSecret: requireEnv("ENTRA_CLIENT_SECRET", env.entraClientSecret),
        tenantId: requireEnv("ENTRA_TENANT_ID", env.entraTenantId),
      }),
    ],
    secret: requireEnv("NEXTAUTH_SECRET", env.nextAuthSecret),
    callbacks: {
      async signIn({ user }) {
        if (!user?.id) return false;
        await ensureDefaultTenant(user.id);
        return true;
      },
      async session({ session, user }) {
        if (session.user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).id = user.id;
        }
        return session;
      },
    },
  };
}


