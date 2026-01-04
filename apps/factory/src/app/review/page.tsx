import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureProductFactory || !env.featureReviewDistribution) redirect("/");

  const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

  const items = await tenantDb.product.findMany({
    where: { tenantId: tenant.id, status: "in_review" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Review queue</div>
          <div className="mt-1 text-sm text-zinc-400">
            Tenant <span className="font-mono text-zinc-200">{tenant.slug}</span> • role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <a
          href="/products"
          className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
        >
          Products
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold text-zinc-100">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-200">{p.productType}</td>
                <td className="px-4 py-3 text-xs">
                  {(() => {
                    const q = (p.contentJson as any)?.quality ?? null;
                    if (!q) return <span className="text-zinc-500">—</span>;
                    const passed = Boolean(q.passed);
                    const kj = Number(q.metrics?.keyJudgments ?? NaN);
                    const cited = Number(q.metrics?.keyJudgmentsWithCitations ?? NaN);
                    return (
                      <div className="space-y-1">
                        <span
                          className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
                            passed
                              ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
                              : "border-rose-900/60 bg-rose-950/30 text-rose-200"
                          }`}
                        >
                          {passed ? "PASS" : "FAIL"}
                        </span>
                        {Number.isFinite(kj) && Number.isFinite(cited) ? (
                          <div className="text-zinc-400">KJ cited {cited}/{kj}</div>
                        ) : null}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-zinc-400">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/products/${encodeURIComponent(p.id)}`}
                    className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                  >
                    Review
                  </a>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-zinc-400">
                  No products in review.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}


