import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { env } from "@/env";
import { getAuthOptions } from "@/lib/auth";
import { prismaControl } from "@/lib/prismaControl";
import { TENANT_COOKIE } from "@/lib/tenancy";

export const runtime = "nodejs";

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");

  const p = await params;
  const token = String(p?.token ?? "").trim();
  if (!token) redirect("/");

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  const email = (session?.user?.email ?? "").trim().toLowerCase();
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  const db = prismaControl();
  const inv = await db.invitation.findUnique({ where: { token } });
  if (!inv) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Invitation not found</div>
          <div className="mt-2 text-sm text-zinc-400">This invitation link is invalid.</div>
        </div>
      </div>
    );
  }

  if (inv.acceptedAt) {
    redirect("/tenants");
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Invitation expired</div>
          <div className="mt-2 text-sm text-zinc-400">Ask a tenant admin to generate a new invitation.</div>
        </div>
      </div>
    );
  }

  if (!email || email !== inv.email.toLowerCase()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Wrong account</div>
          <div className="mt-2 text-sm text-zinc-400">
            You signed in as <span className="font-mono text-zinc-200">{email || "(no email)"}</span>, but this invite
            is for <span className="font-mono text-zinc-200">{inv.email}</span>.
          </div>
          <div className="mt-6 text-xs text-zinc-500">Sign out and sign in with the invited account, then retry.</div>
        </div>
      </div>
    );
  }

  // Accept: create membership and mark accepted.
  await db.membership.upsert({
    where: { tenantId_userId: { tenantId: inv.tenantId, userId } },
    create: { tenantId: inv.tenantId, userId, role: inv.role },
    update: { role: inv.role },
  });
  await db.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });

  // Set active tenant cookie for convenience.
  const tenant = await db.tenant.findUnique({ where: { id: inv.tenantId } });
  if (tenant) {
    const c = await cookies();
    c.set(TENANT_COOKIE, tenant.slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  redirect("/tenants");
}


