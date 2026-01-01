import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import Link from "next/link";

import { env } from "@/env";
import { prismaControl } from "@/lib/prismaControl";
import { requireTenantContext } from "@/lib/rbac";

function tokenBase64Url(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function isEmail(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export const runtime = "nodejs";

export default async function MembersAdminPage() {
  const { tenant } = await requireTenantContext("ADMIN");
  const db = prismaControl();

  const members = await db.membership.findMany({
    where: { tenantId: tenant.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const invites = await db.invitation.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function createInvite(formData: FormData) {
    "use server";
    const { tenant, membership } = await requireTenantContext("ADMIN");
    const db = prismaControl();

    const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
    const roleRaw = String(formData.get("role") ?? "ANALYST").trim().toUpperCase();
    const daysRaw = String(formData.get("days") ?? "7").trim();

    if (!emailRaw || !isEmail(emailRaw)) throw new Error("Valid email is required");
    const role = roleRaw === "ADMIN" || roleRaw === "ANALYST" || roleRaw === "VIEWER" ? roleRaw : "ANALYST";
    const days = Math.max(1, Math.min(30, Number(daysRaw) || 7));

    // Prevent non-admins from inviting admins (defense-in-depth)
    if (membership.role !== "ADMIN" && role === "ADMIN") throw new Error("Forbidden");

    const token = tokenBase64Url(24);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await db.invitation.create({
      data: {
        tenantId: tenant.id,
        email: emailRaw,
        role: role as any,
        token,
        expiresAt,
      },
    });

    revalidatePath("/admin/members");
  }

  async function updateMemberRole(formData: FormData) {
    "use server";
    const { tenant } = await requireTenantContext("ADMIN");
    const db = prismaControl();
    const id = String(formData.get("id") ?? "").trim();
    const roleRaw = String(formData.get("role") ?? "").trim().toUpperCase();
    const role = roleRaw === "ADMIN" || roleRaw === "ANALYST" || roleRaw === "VIEWER" ? roleRaw : null;
    if (!id || !role) throw new Error("Invalid input");
    await db.membership.update({ where: { id }, data: { role: role as any } });
    revalidatePath("/admin/members");
  }

  async function removeMember(formData: FormData) {
    "use server";
    const { tenant, userId } = await requireTenantContext("ADMIN");
    const db = prismaControl();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("Invalid input");

    const row = await db.membership.findUnique({ where: { id } });
    if (!row || row.tenantId !== tenant.id) throw new Error("Not found");
    if (row.userId === userId) throw new Error("You cannot remove yourself");

    await db.membership.delete({ where: { id } });
    revalidatePath("/admin/members");
  }

  const baseUrl = env.nextAuthUrl?.trim() || "";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10 text-zinc-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Tenant admin</div>
          <div className="mt-1 text-sm text-zinc-400">
            Manage members and invitations for <span className="font-mono text-zinc-200">{tenant.slug}</span>
          </div>
        </div>
        <Link
          href="/tenants"
          className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
        >
          Switch tenant
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Invite a member</div>
        <div className="mt-1 text-xs text-zinc-500">Invitation links are accepted after Entra sign-in.</div>

        <form action={createInvite} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            name="email"
            placeholder="user@company.com"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 md:col-span-2"
          />
          <select
            name="role"
            defaultValue="ANALYST"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="VIEWER">VIEWER</option>
            <option value="ANALYST">ANALYST</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <div className="flex gap-2">
            <input
              name="days"
              defaultValue="7"
              className="w-20 rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            />
            <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Create
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Members</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-left text-zinc-300">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-zinc-200">{m.user.email ?? m.user.id}</td>
                  <td className="px-4 py-3">
                    <form action={updateMemberRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={m.id} />
                      <select
                        name="role"
                        defaultValue={m.role}
                        className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs text-zinc-100"
                      >
                        <option value="VIEWER">VIEWER</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeMember}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-zinc-400">
                    No members yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Invitations</div>
        <div className="mt-1 text-xs text-zinc-500">Share the invite link with the intended recipient.</div>

        <div className="mt-4 space-y-3">
          {invites.map((i) => {
            const invitePath = `/invite/${encodeURIComponent(i.token)}`;
            const inviteUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}${invitePath}` : invitePath;
            return (
              <div key={i.id} className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-zinc-200">
                    <span className="font-mono">{i.email}</span> → <span className="font-semibold">{i.role}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {i.acceptedAt ? "accepted" : new Date(i.expiresAt).getTime() < Date.now() ? "expired" : "pending"}
                  </div>
                </div>
                <div className="mt-2 rounded-lg border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-300">
                  {inviteUrl}
                </div>
              </div>
            );
          })}
          {!invites.length ? <div className="text-sm text-zinc-500">No invitations yet.</div> : null}
        </div>
      </section>
    </div>
  );
}


