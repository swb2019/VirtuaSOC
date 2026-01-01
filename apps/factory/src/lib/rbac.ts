import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { getAuthOptions } from "./auth";
import { prismaControl } from "./prismaControl";
import { env } from "../env";
import { getActiveTenantSlug } from "./tenancy";

export type TenantRole = "ADMIN" | "ANALYST" | "VIEWER";

const rank: Record<TenantRole, number> = {
  VIEWER: 0,
  ANALYST: 1,
  ADMIN: 2,
};

export async function requireTenantContext(minRole: TenantRole = "VIEWER") {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const slug = await getActiveTenantSlug();
  if (!slug) redirect("/tenants");

  const tenant = await prismaControl().tenant.findUnique({ where: { slug } });
  if (!tenant) redirect("/tenants");

  const membership = await prismaControl().membership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
  });
  if (!membership) redirect("/tenants");

  const have = rank[membership.role as TenantRole] ?? 0;
  const need = rank[minRole] ?? 0;
  if (have < need) {
    throw new Error("Forbidden");
  }

  return { session, userId, tenant, membership, tenantSlug: slug };
}


