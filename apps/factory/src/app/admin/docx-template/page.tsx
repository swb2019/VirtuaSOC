import { createHash } from "node:crypto";

import Link from "next/link";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024; // 10MB

export default async function DocxTemplateAdminPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureProductFactory) redirect("/");

  const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");

  const tpl = await tenantDb.tenantDocxTemplate
    .findUnique({ where: { tenantId: tenant.id } })
    .catch(() => null);

  async function upload(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");

    const file = formData.get("file");
    const label = String(formData.get("label") ?? "").trim() || null;
    if (!(file instanceof File)) throw new Error("file is required");

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.length) throw new Error("Empty file");
    if (bytes.length > MAX_TEMPLATE_BYTES) throw new Error("Template too large (max 10MB)");

    // Basic file-type check: we allow .docx/.dotx but don’t parse/validate contents here.
    const ct =
      typeof file.type === "string" && file.type.trim()
        ? file.type.trim()
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const sha256 = createHash("sha256").update(bytes).digest("hex");

    await tenantDb.tenantDocxTemplate.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        label,
        docxBytes: bytes,
        docxSha256: sha256,
        contentType: ct,
      },
      update: {
        label,
        docxBytes: bytes,
        docxSha256: sha256,
        contentType: ct,
      },
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "tenant.docx_template.upsert",
        actorUserId: membership.userId,
        targetType: "tenant_docx_template",
        targetId: tenant.id,
        metadata: { label, sha256, bytes: bytes.length, contentType: ct },
      },
    });

    redirect("/admin/docx-template");
  }

  async function clear() {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");
    await tenantDb.tenantDocxTemplate.delete({ where: { tenantId: tenant.id } }).catch(() => null);
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "tenant.docx_template.deleted",
        actorUserId: membership.userId,
        targetType: "tenant_docx_template",
        targetId: tenant.id,
        metadata: {},
      },
    });
    redirect("/admin/docx-template");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10 text-zinc-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Tenant DOCX template</div>
          <div className="mt-1 text-sm text-zinc-400">
            Optional Word styling override for DOCX exports • tenant <span className="font-mono text-zinc-200">{tenant.slug}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/members"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Back to admin
          </Link>
          <Link
            href="/products"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Products
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Current template</div>
        <div className="mt-2 text-xs text-zinc-500">
          If set, the worker uses it as a Pandoc reference doc to style exported DOCX files.
        </div>

        {tpl ? (
          <div className="mt-4 space-y-2 text-xs text-zinc-200">
            <div>
              <span className="text-zinc-400">label:</span> {tpl.label ?? "—"}
            </div>
            <div>
              <span className="text-zinc-400">sha256:</span> <span className="font-mono">{tpl.docxSha256}</span>
            </div>
            <div>
              <span className="text-zinc-400">updated:</span> {new Date(tpl.updatedAt).toLocaleString()}
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href="/api/docx-template"
                className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
              >
                Download
              </a>
              <form action={clear}>
                <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                  Remove
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-zinc-400">No tenant DOCX template configured.</div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Upload template</div>
        <div className="mt-2 text-xs text-zinc-500">
          Upload a corporate Word template (DOCX/DOTX). This is stored in the tenant DB.
        </div>

        <form action={upload} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Template file</label>
            <input
              name="file"
              type="file"
              accept=".docx,.dotx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Label (optional)</label>
            <input
              name="label"
              placeholder="e.g. Contoso GSOC v3"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Upload
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


