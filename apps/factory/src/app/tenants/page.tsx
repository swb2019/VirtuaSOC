import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { getAuthOptions } from "@/lib/auth";
import { prismaControl } from "@/lib/prismaControl";
import { env } from "@/env";
import { TenantPickerClient } from "./TenantPickerClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const memberships = await prismaControl().membership.findMany({
    where: { userId },
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <div className="text-xl font-semibold">Choose tenant</div>
        <div className="mt-1 text-sm text-zinc-400">Select the tenant workspace you want to operate in.</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
            {memberships.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-semibold text-zinc-100">{m.tenant.name}</td>
                <td className="px-4 py-3 font-mono text-zinc-300">{m.tenant.slug}</td>
                <td className="px-4 py-3 text-zinc-300">{m.role}</td>
                <td className="px-4 py-3 text-right">
                  <TenantPickerClient slug={m.tenant.slug} />
                </td>
              </tr>
            ))}
            {!memberships.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-400">
                  No tenant memberships yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}


