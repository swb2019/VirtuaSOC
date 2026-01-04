import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { getIngestQueue, JOB_PRODUCTS_GENERATE } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SeedResult = { ok: true } | { ok: false; error: string };

function defaultPromptText(): string {
  return [
    "You are an intelligence analyst assistant drafting standardized GSOC intelligence products.",
    "",
    "Hard tradecraft rules (non-negotiable):",
    "- Evidence-bound: ONLY use the provided evidence refs (EVD-###). Do NOT invent sources, facts, or URLs.",
    "- Do NOT include URLs anywhere (no http/https).",
    "- Do NOT mention analytic confidence or likelihood in bodyMarkdown or changeFromLast; those are handled in separate fields.",
    "",
    "Daily Intelligence Summary (DIS) rubric expectations:",
    "- keyJudgments must be 3–5 items AND each item must cite at least one EVD-###.",
    "- evidenceRefs must exactly match the set of EVD-### refs used in keyJudgments/bodyMarkdown/changeFromLast.",
    "- Use concise, decision-oriented language suitable for a Fortune 500 GSOC.",
    "",
    "Return a tool call that populates the required JSON fields exactly.",
  ].join("\n");
}

function defaultToolSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      keyJudgments: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      indicators: { type: "array", items: { type: "string" } },
      evidenceRefs: { type: "array", items: { type: "string" }, minItems: 1 },
      bodyMarkdown: { type: "string" },
      likelihood: {
        type: "object",
        additionalProperties: false,
        properties: {
          term: { type: "string" },
          min: { type: "number" },
          max: { type: "number" },
        },
        required: ["term", "min", "max"],
      },
      risk: {
        type: "object",
        additionalProperties: false,
        properties: {
          likelihood: { type: "number" },
          impact: { type: "number" },
        },
        required: ["likelihood", "impact"],
      },
      actions: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            owner: { type: "string" },
            deadline: { type: "string" },
            title: { type: "string" },
            notes: { type: "string" },
          },
          required: ["owner", "deadline", "title"],
        },
      },
      changeFromLast: { type: "string" },
    },
    required: ["title", "keyJudgments", "indicators", "evidenceRefs", "bodyMarkdown", "likelihood", "risk", "actions"],
  };
}

export default async function ProductsPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureProductFactory) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Products</div>
          <div className="mt-2 text-sm text-zinc-400">M5 (Product Factory) is not enabled yet.</div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_PRODUCT_FACTORY=true</code> to enable.
          </div>
        </div>
      </div>
    );
  }

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const productConfigs = await tenantDb.productConfig.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { promptVersion: true },
  });

  const products = await tenantDb.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const signals = await tenantDb.signal
    .findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 25,
    })
    .catch(() => []);

  async function seedDefaults(): Promise<SeedResult> {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ADMIN");

    const existing = await tenantDb.productConfig.findFirst({ where: { tenantId: tenant.id } });
    if (existing) return { ok: true };

    const prompt = await tenantDb.promptVersion.create({
      data: {
        tenantId: tenant.id,
        name: "ipf_v1",
        schemaVersion: "1",
        promptText: defaultPromptText(),
        jsonSchema: defaultToolSchema() as any,
        changelog: "Initial prompt + schema",
      },
    });

    await tenantDb.productConfig.createMany({
      data: [
        {
          tenantId: tenant.id,
          productType: "daily_intel_summary",
          name: "Daily Intelligence Summary",
          enabled: true,
          cadence: "daily",
          trigger: { cadence: "daily" } as any,
          scope: {
            windowHours: 24,
            maxEvidence: 35,
            includeSignalKinds: ["facility_geofence", "route_corridor"],
            signalMinSeverity: 3,
            rubric: { requireKeyJudgmentEvidenceRefs: true, requireEvidenceRefsMatchUsed: true },
          } as any,
          templateMarkdown: [
            "# {{TITLE}}",
            "",
            "## Key Judgments (evidence-bound)",
            "{{KEY_JUDGMENTS}}",
            "",
            "## Narrative",
            "{{BODY}}",
            "",
            "## Evidence (blinded)",
            "{{EVIDENCE}}",
            "",
            "## Analytic Confidence",
            "{{CONFIDENCE_LEVEL}}",
            "",
            "{{CONFIDENCE_RATIONALE}}",
            "",
            "## Likelihood",
            "{{LIKELIHOOD_TERM}} ({{LIKELIHOOD_MIN}}–{{LIKELIHOOD_MAX}})",
            "",
            "## Risk Matrix",
            "Likelihood {{RISK_LIKELIHOOD}} / Impact {{RISK_IMPACT}}",
            "",
            "## Indicators/Signposts",
            "{{INDICATORS}}",
            "",
            "## Actions",
            "{{ACTIONS}}",
            "",
            "{{CHANGE_FROM_LAST_SECTION}}",
          ].join("\n"),
          promptVersionId: prompt.id,
          distributionRules: { channels: ["email", "webhook", "teams"] } as any,
          reviewPolicy: { requireReviewIfPerson: true } as any,
        },
        {
          tenantId: tenant.id,
          productType: "flash_alert",
          name: "Flash Alert",
          enabled: true,
          cadence: null,
          trigger: { onSignalSeverityGte: 4 } as any,
          scope: { fromSignal: true, windowHours: 6, maxEvidence: 10 } as any,
          templateMarkdown: "",
          promptVersionId: prompt.id,
          distributionRules: { channels: ["email", "webhook", "teams"] } as any,
          reviewPolicy: { requireReviewIfPerson: true } as any,
        },
        {
          tenantId: tenant.id,
          productType: "weekly_intel_report",
          name: "Weekly Intel Report",
          enabled: true,
          cadence: "weekly",
          trigger: { cadence: "weekly" } as any,
          scope: { windowDays: 7, maxEvidence: 50 } as any,
          templateMarkdown: "",
          promptVersionId: prompt.id,
          distributionRules: { channels: ["email", "webhook", "teams"] } as any,
          reviewPolicy: { requireReviewIfPerson: true } as any,
        },
      ],
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product_configs.seeded_defaults",
        actorUserId: membership.userId,
        targetType: "product_config",
        targetId: null,
        metadata: { count: 3, names: ["Daily Intelligence Summary", "Flash Alert", "Weekly Intel Report"] },
      },
    });

    return { ok: true };
  }

  async function enqueueGenerate(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const productType = String(formData.get("productType") ?? "").trim();
    const signalId = String(formData.get("signalId") ?? "").trim() || undefined;
    if (!productType) throw new Error("productType is required");

    const jobId = signalId
      ? `prodgen:${tenant.id}:${productType}:sig:${signalId}`
      : `prodgen:${tenant.id}:${productType}:${new Date().toISOString().slice(0, 10)}`;

    await getIngestQueue().add(
      JOB_PRODUCTS_GENERATE,
      {
        tenantId: tenant.id,
        productType,
        signalId,
        actorUserId: membership.userId,
      },
      { jobId, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.generation.queued",
        actorUserId: membership.userId,
        targetType: signalId ? "signal" : "product_config",
        targetId: null,
        metadata: { productType, signalId: signalId ?? null },
      },
    });

    redirect("/products");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Products</div>
          <div className="mt-1 text-sm text-zinc-400">
            Tenant <span className="font-mono text-zinc-200">{tenant.slug}</span> • Role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/signals"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Signals
          </a>
          <a
            href="/map"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Map
          </a>
          {env.featureReviewDistribution ? (
            <a
              href="/review"
              className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
            >
              Review queue
            </a>
          ) : null}
          <a
            href="/evidence"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Evidence
          </a>
          <a
            href="/tenants"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Switch tenant
          </a>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-200">Product configs</div>
            <div className="mt-1 text-xs text-zinc-500">Configs drive product generation (no bespoke code per type).</div>
          </div>
          {membership.role === "ADMIN" ? (
            <form
              action={async () => {
                "use server";
                const r = await seedDefaults();
                if (!r.ok) throw new Error(r.error);
                redirect("/products");
              }}
            >
              <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                Seed 3 defaults
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-left text-zinc-300">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3 text-right">Generate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
              {productConfigs.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-200">{c.productType}</td>
                  <td className="px-4 py-3 text-zinc-200">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.enabled ? "yes" : "no"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={enqueueGenerate}>
                      <input type="hidden" name="productType" value={c.productType} />
                      <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                        Generate
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!productConfigs.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-zinc-400">
                    No product configs yet. (Admin can seed defaults.)
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Generate from a signal (Flash Alert)</div>
        <div className="mt-1 text-xs text-zinc-500">
          Pick a signal to scope evidence for the draft (e.g., severity ≥ 4).
        </div>

        <form action={enqueueGenerate} className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="productType" value="flash_alert" />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Signal</label>
            <select
              name="signalId"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
              defaultValue={signals[0]?.id ?? ""}
            >
              {signals.map((s: any) => (
                <option key={s.id} value={s.id}>
                  sev {s.severity} • {String(s.title ?? s.id).slice(0, 80)}
                </option>
              ))}
              {!signals.length ? <option value="">No signals yet</option> : null}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Generate Flash Alert
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 font-semibold text-zinc-100">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-200">{p.productType}</td>
                <td className="px-4 py-3 text-zinc-300">{p.status}</td>
                <td className="px-4 py-3 text-zinc-400">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/products/${encodeURIComponent(p.id)}`}
                    className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {!products.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-zinc-400">
                  No products yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}


