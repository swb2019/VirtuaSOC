import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { getIngestQueue, JOB_PRODUCTS_DISTRIBUTE } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureProductFactory) redirect("/");

  const p = await params;
  const productId = String(p?.id ?? "").trim();
  if (!productId) redirect("/products");

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const product = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Product not found</div>
          <div className="mt-4">
            <a
              href="/products"
              className="rounded-lg border border-zinc-800 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
            >
              Back
            </a>
          </div>
        </div>
      </div>
    );
  }

  const actions = await tenantDb.actionItem.findMany({
    where: { tenantId: tenant.id, productId: product.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const targets = await tenantDb.distributionTarget
    .findMany({
      where: { tenantId: tenant.id, enabled: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .catch(() => []);

  const exportRow = await tenantDb.productExport
    .findUnique({ where: { productId: product.id } })
    .catch(() => null);

  const distributions = await tenantDb.productDistributionRecord
    .findMany({
      where: { tenantId: tenant.id, productId: product.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  async function submitForReview() {
    "use server";
    if (!env.featureReviewDistribution) throw new Error("M6 (Review + distribution) is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const row = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
    if (!row) throw new Error("Not found");
    if (row.status !== "draft") throw new Error("Only drafts can be submitted for review");
    await tenantDb.product.update({ where: { id: row.id }, data: { status: "in_review" } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.submitted_for_review",
        actorUserId: membership.userId,
        targetType: "product",
        targetId: row.id,
        metadata: { from: "draft", to: "in_review" },
      },
    });
    redirect(`/products/${encodeURIComponent(productId)}`);
  }

  async function approve() {
    "use server";
    if (!env.featureReviewDistribution) throw new Error("M6 (Review + distribution) is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");
    const row = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
    if (!row) throw new Error("Not found");
    if (row.status !== "in_review") throw new Error("Only in_review products can be approved");
    await tenantDb.product.update({
      where: { id: row.id },
      data: { status: "approved", approvedByUserId: membership.userId, approvedAt: new Date() },
    });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.approved",
        actorUserId: membership.userId,
        targetType: "product",
        targetId: row.id,
        metadata: { from: "in_review", to: "approved" },
      },
    });
    redirect(`/products/${encodeURIComponent(productId)}`);
  }

  async function reject() {
    "use server";
    if (!env.featureReviewDistribution) throw new Error("M6 (Review + distribution) is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");
    const row = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
    if (!row) throw new Error("Not found");
    if (row.status !== "in_review") throw new Error("Only in_review products can be rejected");
    await tenantDb.product.update({ where: { id: row.id }, data: { status: "rejected" } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.rejected",
        actorUserId: membership.userId,
        targetType: "product",
        targetId: row.id,
        metadata: { from: "in_review", to: "rejected" },
      },
    });
    redirect(`/products/${encodeURIComponent(productId)}`);
  }

  async function enqueuePdf() {
    "use server";
    if (!env.featureReviewDistribution) throw new Error("M6 (Review + distribution) is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    await getIngestQueue().add(
      JOB_PRODUCTS_DISTRIBUTE,
      { tenantId: tenant.id, productId, distributionTargetIds: [], actorUserId: membership.userId, renderOnly: true },
      { jobId: `prodexport:${tenant.id}:${productId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.pdf_export.queued",
        actorUserId: membership.userId,
        targetType: "product",
        targetId: productId,
        metadata: {},
      },
    });
    redirect(`/products/${encodeURIComponent(productId)}`);
  }

  async function enqueueDistribute(formData: FormData) {
    "use server";
    if (!env.featureReviewDistribution) throw new Error("M6 (Review + distribution) is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");
    const row = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
    if (!row) throw new Error("Not found");
    if (row.status !== "approved") throw new Error("Only approved products can be distributed");

    const targetIds = formData.getAll("targetId").map((x) => String(x).trim()).filter(Boolean);
    if (!targetIds.length) throw new Error("Select at least one distribution target");

    await getIngestQueue().add(
      JOB_PRODUCTS_DISTRIBUTE,
      { tenantId: tenant.id, productId, distributionTargetIds: targetIds, actorUserId: membership.userId },
      { jobId: `proddist:${tenant.id}:${productId}:${Date.now()}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.distribution.queued",
        actorUserId: membership.userId,
        targetType: "product",
        targetId: productId,
        metadata: { targetIds, count: targetIds.length },
      },
    });

    redirect(`/products/${encodeURIComponent(productId)}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">{product.title}</div>
          <div className="mt-1 text-sm text-zinc-400">
            <span className="font-mono text-zinc-200">{product.productType}</span> • status{" "}
            <span className="font-semibold">{product.status}</span> • tenant{" "}
            <span className="font-mono text-zinc-200">{tenant.slug}</span> • role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/products"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Back
          </a>
          {env.featureReviewDistribution ? (
            <>
              {product.status === "draft" && membership.role !== "VIEWER" ? (
                <form action={submitForReview}>
                  <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                    Submit for review
                  </button>
                </form>
              ) : null}
              {product.status === "in_review" && membership.role === "ADMIN" ? (
                <>
                  <form action={approve}>
                    <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                      Approve
                    </button>
                  </form>
                  <form action={reject}>
                    <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                      Reject
                    </button>
                  </form>
                </>
              ) : null}
              {membership.role !== "VIEWER" ? (
                <form action={enqueuePdf}>
                  <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                    Generate PDF
                  </button>
                </form>
              ) : null}
              {exportRow?.pdfBytes ? (
                <a
                  href={`/api/products/${encodeURIComponent(product.id)}/pdf`}
                  className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                >
                  Download PDF
                </a>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Tradecraft fields</div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div>
              <div className="text-xs font-semibold text-zinc-400">Analytic confidence</div>
              <div className="mt-1">
                <span className="font-semibold text-zinc-100">{product.confidenceLevel}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-400 whitespace-pre-wrap">{product.confidenceRationale}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-400">Likelihood</div>
                <div className="mt-1 text-zinc-200">
                  {product.likelihoodTerm ?? "—"}{" "}
                  {product.likelihoodMin != null && product.likelihoodMax != null
                    ? `(${product.likelihoodMin}–${product.likelihoodMax})`
                    : ""}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400">Risk</div>
                <div className="mt-1 text-zinc-200">
                  L {product.riskLikelihood ?? "—"} / I {product.riskImpact ?? "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-400">Key judgments</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-200">
                {(product.keyJudgments ?? []).map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-400">Indicators / signposts</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-200">
                {(product.indicators ?? []).map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            {product.changeFromLast ? (
              <div>
                <div className="text-xs font-semibold text-zinc-400">Change from last</div>
                <div className="mt-1 whitespace-pre-wrap text-zinc-200">{product.changeFromLast}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Actions</div>
          <div className="mt-4 space-y-3">
            {actions.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <div className="text-sm font-semibold text-zinc-100">{a.title}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  owner=<span className="font-mono text-zinc-200">{a.owner}</span> • due=
                  <span className="font-mono text-zinc-200">{a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 10) : "—"}</span>{" "}
                  • status=<span className="font-mono text-zinc-200">{a.status}</span>
                </div>
                {a.notes ? <div className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap">{a.notes}</div> : null}
              </div>
            ))}
            {!actions.length ? <div className="text-sm text-zinc-500">No action items.</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Rendered markdown</div>
        <div className="mt-4 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-black/20 p-4 text-xs text-zinc-200">
          {product.contentMarkdown ?? "(no content)"}
        </div>
      </section>

      {env.featureReviewDistribution ? (
        <>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="text-sm font-semibold text-zinc-200">Distribution</div>
            <div className="mt-1 text-xs text-zinc-500">
              Requires <span className="font-semibold">approved</span> status. Targets are tenant-scoped.
            </div>

            {membership.role === "ADMIN" ? (
              <form action={enqueueDistribute} className="mt-4 space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                  {targets.map((t: any) => (
                    <label key={t.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-black/20 p-3">
                      <input type="checkbox" name="targetId" value={t.id} className="mt-1" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {t.kind} {t.label ? `• ${t.label}` : ""}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-zinc-400">{t.value}</div>
                      </div>
                    </label>
                  ))}
                  {!targets.length ? (
                    <div className="text-sm text-zinc-500">
                      No enabled distribution targets yet. Configure them via the Setup Assistant or API.
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={product.status !== "approved" || !targets.length}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    Distribute
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 text-sm text-zinc-500">Only tenant admins can distribute.</div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="text-sm font-semibold text-zinc-200">Distribution history</div>
            <div className="mt-4 space-y-2">
              {distributions.map((d: any) => (
                <div key={d.id} className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-100">{d.kind}</span> →{" "}
                      <span className="font-mono text-zinc-200">{d.target ?? "—"}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {d.status} {d.sentAt ? `• ${new Date(d.sentAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  {d.error ? <div className="mt-2 text-xs text-rose-200 whitespace-pre-wrap">{d.error}</div> : null}
                </div>
              ))}
              {!distributions.length ? <div className="text-sm text-zinc-500">No distributions yet.</div> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}


