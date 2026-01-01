import { randomUUID } from "node:crypto";

import type { Db } from "../db.js";
import { openAiToolCall } from "../llm/openai.js";
import { mockGenerateProduct } from "../llm/mock.js";
import {
  validateGeneratedProductJson,
  type ConfidenceLevel,
  type GeneratedProductJson,
} from "./productSchema.js";

export type GenerateProductJobPayload = {
  tenantId: string;
  productType: string;
  signalId?: string;
  actorUserId?: string | null;
};

type ProductConfigRow = {
  id: string;
  product_type: string;
  name: string;
  enabled: boolean;
  cadence: string | null;
  trigger: any;
  scope: any;
  template_markdown: string;
  prompt_version_id: string | null;
  distribution_rules: any;
  review_policy: any;
};

type PromptVersionRow = {
  id: string;
  name: string;
  schema_version: string;
  prompt_text: string;
  json_schema: any;
};

type EvidenceRow = {
  id: string;
  fetched_at: string;
  source_type: string;
  source_uri: string | null;
  title: string | null;
  summary: string | null;
  content_text: string | null;
  tags: string[];
  triage_status: string | null;
};

type EntityRow = {
  id: string;
  type: string;
  name: string;
  pii_flag: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "[REDACTED_URL]");
}

function sanitizeEvidenceText(text: string): string {
  // Treat all ingested text as hostile (prompt injection defense): remove URLs and cap length.
  const stripped = stripUrls(text);
  return stripped.replace(/\u0000/g, "").trim().slice(0, 1200);
}

function evidenceRef(i: number): string {
  const n = String(i + 1).padStart(3, "0");
  return `EVD-${n}`;
}

function computeConfidence(evidence: EvidenceRow[]): { level: ConfidenceLevel; rationale: string } {
  const count = evidence.length;
  const hosts = new Set<string>();
  let cisa = 0;
  for (const e of evidence) {
    if (e.source_uri) {
      try {
        hosts.add(new URL(e.source_uri).hostname.toLowerCase());
      } catch {
        // ignore
      }
    }
    if (e.source_uri?.includes("cisa.gov")) cisa++;
    if ((e.source_type ?? "").toLowerCase() === "rss" && e.source_uri?.includes("cisa.gov")) cisa++;
  }

  let score = 0;
  const reasons: string[] = [];
  if (count >= 15) {
    score += 40;
    reasons.push("evidence_count>=15 (+40)");
  } else if (count >= 7) {
    score += 25;
    reasons.push("evidence_count>=7 (+25)");
  } else if (count >= 3) {
    score += 15;
    reasons.push("evidence_count>=3 (+15)");
  } else {
    score += 5;
    reasons.push("evidence_count<3 (+5)");
  }

  if (hosts.size >= 3) {
    score += 25;
    reasons.push("source_diversity>=3_hosts (+25)");
  } else if (hosts.size >= 2) {
    score += 15;
    reasons.push("source_diversity>=2_hosts (+15)");
  } else if (hosts.size >= 1) {
    score += 5;
    reasons.push("source_diversity>=1_host (+5)");
  }

  if (cisa >= 2) {
    score += 25;
    reasons.push("trusted_source=cisa>=2 (+25)");
  } else if (cisa >= 1) {
    score += 15;
    reasons.push("trusted_source=cisa>=1 (+15)");
  }

  score = clamp(score, 0, 100);

  let level: ConfidenceLevel = "UNKNOWN";
  if (score >= 75) level = "HIGH";
  else if (score >= 45) level = "MEDIUM";
  else level = "LOW";

  return { level, rationale: `${level} (score=${score}). Factors: ${reasons.join(", ")}` };
}

function toolSchemaForGeneratedProduct(): Record<string, unknown> {
  // Keep stable; prompt versions can store the same schema for versioning/auditing.
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

function renderTemplate(args: {
  template: string;
  title: string;
  keyJudgments: string[];
  evidenceBullets: string[];
  confidenceLevel: string;
  confidenceRationale: string;
  likelihoodTerm: string;
  likelihoodMin: number;
  likelihoodMax: number;
  riskLikelihood: number;
  riskImpact: number;
  bodyMarkdown: string;
  indicators: string[];
  actions: { owner: string; deadline: string; title: string; notes?: string }[];
  changeFromLast?: string;
}): string {
  const bullets = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const actionLines = args.actions
    .map((a) => `- ${a.title} (owner: ${a.owner}, due: ${a.deadline})${a.notes ? `\\n  - ${a.notes}` : ""}`)
    .join("\n");

  const base = args.template?.trim()
    ? args.template
    : [
        `# {{TITLE}}`,
        ``,
        `## Key Judgments`,
        `{{KEY_JUDGMENTS}}`,
        ``,
        `## Evidence (blinded)`,
        `{{EVIDENCE}}`,
        ``,
        `## Analytic Confidence`,
        `{{CONFIDENCE_LEVEL}}`,
        ``,
        `{{CONFIDENCE_RATIONALE}}`,
        ``,
        `## Likelihood`,
        `{{LIKELIHOOD_TERM}} ({{LIKELIHOOD_MIN}}–{{LIKELIHOOD_MAX}})`,
        ``,
        `## Risk Matrix`,
        `Likelihood {{RISK_LIKELIHOOD}} / Impact {{RISK_IMPACT}}`,
        ``,
        `## Narrative`,
        `{{BODY}}`,
        ``,
        `## Indicators/Signposts`,
        `{{INDICATORS}}`,
        ``,
        `## Actions`,
        `{{ACTIONS}}`,
        ``,
        `{{CHANGE_FROM_LAST_SECTION}}`,
      ].join("\n");

  const changeSection = args.changeFromLast?.trim()
    ? `## Change from last\n${args.changeFromLast.trim()}\n`
    : "";

  return base
    .replaceAll("{{TITLE}}", args.title)
    .replaceAll("{{KEY_JUDGMENTS}}", bullets(args.keyJudgments))
    .replaceAll("{{EVIDENCE}}", bullets(args.evidenceBullets))
    .replaceAll("{{CONFIDENCE_LEVEL}}", args.confidenceLevel)
    .replaceAll("{{CONFIDENCE_RATIONALE}}", args.confidenceRationale)
    .replaceAll("{{LIKELIHOOD_TERM}}", args.likelihoodTerm)
    .replaceAll("{{LIKELIHOOD_MIN}}", String(args.likelihoodMin))
    .replaceAll("{{LIKELIHOOD_MAX}}", String(args.likelihoodMax))
    .replaceAll("{{RISK_LIKELIHOOD}}", String(args.riskLikelihood))
    .replaceAll("{{RISK_IMPACT}}", String(args.riskImpact))
    .replaceAll("{{BODY}}", args.bodyMarkdown)
    .replaceAll("{{INDICATORS}}", bullets(args.indicators))
    .replaceAll("{{ACTIONS}}", actionLines)
    .replaceAll("{{CHANGE_FROM_LAST_SECTION}}", changeSection);
}

async function ensureSeeded(db: Db, tenantId: string) {
  const existing = await db<{ ok: number }[]>`
    SELECT 1 as ok FROM product_configs WHERE tenant_id = ${tenantId} LIMIT 1
  `;
  if (existing.length) return;

  const toolSchema = toolSchemaForGeneratedProduct();

  const promptId = randomUUID();
  await db`
    INSERT INTO prompt_versions (
      id, tenant_id, name, schema_version, prompt_text, json_schema, changelog
    ) VALUES (
      ${promptId},
      ${tenantId},
      ${"ipf_v1"},
      ${"1"},
      ${[
        "You are an intelligence analyst assistant.",
        "You MUST be evidence-bound: only use the provided blinded evidence references (EVD-###).",
        "Do NOT include URLs anywhere (no http/https).",
        "Do NOT mention analytic confidence or likelihood in the narrative body; those are handled elsewhere.",
        "Return a tool call that populates the required JSON fields.",
      ].join("\\n")},
      ${db.json(toolSchema)},
      ${"Initial prompt + schema"},
    )
  `;

  const dailyTemplate = ""; // use default renderer template
  const flashTemplate = "";
  const weeklyTemplate = "";

  await db`
    INSERT INTO product_configs (
      id, tenant_id, product_type, name, enabled, cadence, trigger, scope, template_markdown, prompt_version_id,
      distribution_rules, review_policy
    ) VALUES (
      ${randomUUID()},
      ${tenantId},
      ${"daily_intel_summary"},
      ${"Daily Intelligence Summary"},
      ${true},
      ${"daily"},
      ${db.json({ cadence: "daily" })},
      ${db.json({ windowHours: 24, maxEvidence: 25 })},
      ${dailyTemplate},
      ${promptId},
      ${db.json({ channels: ["email", "webhook", "teams"] })},
      ${db.json({ requireReviewIfPerson: true })},
    ), (
      ${randomUUID()},
      ${tenantId},
      ${"flash_alert"},
      ${"Flash Alert"},
      ${true},
      ${null},
      ${db.json({ onSignalSeverityGte: 4 })},
      ${db.json({ fromSignal: true, windowHours: 6, maxEvidence: 10 })},
      ${flashTemplate},
      ${promptId},
      ${db.json({ channels: ["email", "webhook", "teams"] })},
      ${db.json({ requireReviewIfPerson: true })},
    ), (
      ${randomUUID()},
      ${tenantId},
      ${"weekly_intel_report"},
      ${"Weekly Intel Report"},
      ${true},
      ${"weekly"},
      ${db.json({ cadence: "weekly" })},
      ${db.json({ windowDays: 7, maxEvidence: 50 })},
      ${weeklyTemplate},
      ${promptId},
      ${db.json({ channels: ["email", "webhook", "teams"] })},
      ${db.json({ requireReviewIfPerson: true })},
    )
    ON CONFLICT DO NOTHING
  `;
}

function llmProvider(): "mock" | "openai" {
  const raw = (process.env.LLM_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "openai") return "openai";
  return "mock";
}

async function generateWithOpenAi(args: {
  productName: string;
  promptText: string;
  evidenceRefs: { ref: string; title: string; summary: string; excerpt: string; tags: string[] }[];
  requireChangeFromLast: boolean;
  priorSummary?: string;
}): Promise<unknown> {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for LLM_PROVIDER=openai");

  const model = (process.env.OPENAI_MODEL ?? "").trim() || "gpt-5.2";
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "").trim() || undefined;

  const toolName = "generate_product";
  const tool = {
    type: "function" as const,
    function: {
      name: toolName,
      description: "Generate a structured intelligence product JSON object (evidence-bound, no URLs).",
      parameters: toolSchemaForGeneratedProduct(),
    },
  };

  const evidenceBlock = args.evidenceRefs
    .map((e) => {
      const tags = e.tags?.length ? `tags=${e.tags.join(",")}` : "tags=(none)";
      return [
        `${e.ref}:`,
        `title: ${e.title || "(none)"}`,
        `summary: ${e.summary || "(none)"}`,
        `excerpt: ${e.excerpt || "(none)"}`,
        `meta: ${tags}`,
      ].join("\n");
    })
    .join("\n\n");

  const prior = args.priorSummary?.trim()
    ? `\n\nPrior product summary (for changeFromLast only):\n${sanitizeEvidenceText(args.priorSummary)}\n`
    : "";

  const system = [
    args.promptText,
    "",
    "Hard rules:",
    "- Use only the provided EVD-### references. Do not invent sources, URLs, or citations.",
    "- Do not include any URLs anywhere.",
    "- Do not mention analytic confidence or likelihood in bodyMarkdown.",
    args.requireChangeFromLast ? "- changeFromLast is required." : "- changeFromLast is optional.",
  ].join("\n");

  const user = [
    `Product type: ${args.productName}`,
    `Evidence set (blinded references):`,
    evidenceBlock,
    prior,
    `Return a tool call to ${toolName} with the required JSON fields.`,
  ].join("\n\n");

  const { toolArgsJson } = await openAiToolCall({
    apiKey,
    model,
    baseUrl,
    maxOutputTokens: 900,
    tool,
    toolName,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return toolArgsJson;
}

async function loadConfig(db: Db, tenantId: string, productType: string): Promise<{ cfg: ProductConfigRow; prompt: PromptVersionRow | null }> {
  const rows = await db<ProductConfigRow[]>`
    SELECT id, product_type, name, enabled, cadence, trigger, scope, template_markdown, prompt_version_id, distribution_rules, review_policy
    FROM product_configs
    WHERE tenant_id = ${tenantId} AND product_type = ${productType}
    LIMIT 1
  `;
  if (!rows.length) throw new Error(`Unknown productType: ${productType}`);
  const cfg = rows[0]!;
  if (!cfg.enabled) throw new Error(`ProductConfig disabled: ${productType}`);

  let prompt: PromptVersionRow | null = null;
  if (cfg.prompt_version_id) {
    const pr = await db<PromptVersionRow[]>`
      SELECT id, name, schema_version, prompt_text, json_schema
      FROM prompt_versions
      WHERE tenant_id = ${tenantId} AND id = ${cfg.prompt_version_id}
      LIMIT 1
    `;
    prompt = pr[0] ?? null;
  }

  return { cfg, prompt };
}

function parseWindow(scope: any): { hours: number; maxEvidence: number } {
  const windowHours = Number(scope?.windowHours ?? NaN);
  const windowDays = Number(scope?.windowDays ?? NaN);
  const maxEvidence = clamp(Number(scope?.maxEvidence ?? 25), 1, 200);

  if (Number.isFinite(windowHours) && windowHours > 0) return { hours: clamp(windowHours, 1, 24 * 30), maxEvidence };
  if (Number.isFinite(windowDays) && windowDays > 0) return { hours: clamp(windowDays * 24, 1, 24 * 365), maxEvidence };
  return { hours: 24, maxEvidence };
}

async function evidenceForJob(db: Db, payload: GenerateProductJobPayload, cfg: ProductConfigRow): Promise<EvidenceRow[]> {
  if (payload.signalId) {
    const rows = await db<{ evidence_id: string }[]>`
      SELECT evidence_id
      FROM signal_evidence_links
      WHERE tenant_id = ${payload.tenantId} AND signal_id = ${payload.signalId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const ids = rows.map((r) => r.evidence_id);
    if (!ids.length) return [];

    return await db<EvidenceRow[]>`
      SELECT id, fetched_at, source_type, source_uri, title, summary, content_text, tags, triage_status
      FROM evidence_items
      WHERE tenant_id = ${payload.tenantId} AND id = ANY(${db.array(ids, 2950)})
      ORDER BY fetched_at DESC
      LIMIT 50
    `;
  }

  const { hours, maxEvidence } = parseWindow(cfg.scope ?? {});
  return await db<EvidenceRow[]>`
    SELECT id, fetched_at, source_type, source_uri, title, summary, content_text, tags, triage_status
    FROM evidence_items
    WHERE tenant_id = ${payload.tenantId}
      AND fetched_at > NOW() - (${hours}::int * INTERVAL '1 hour')
    ORDER BY fetched_at DESC
    LIMIT ${maxEvidence}
  `;
}

async function entitiesForEvidence(db: Db, tenantId: string, evidenceIds: string[]): Promise<EntityRow[]> {
  if (!evidenceIds.length) return [];
  const entityIds = await db<{ entity_id: string }[]>`
    SELECT DISTINCT entity_id
    FROM evidence_entity_links
    WHERE tenant_id = ${tenantId} AND evidence_id = ANY(${db.array(evidenceIds, 2950)})
    LIMIT 200
  `;
  const ids = entityIds.map((r) => r.entity_id);
  if (!ids.length) return [];
  return await db<EntityRow[]>`
    SELECT id, type, name, pii_flag
    FROM entities
    WHERE tenant_id = ${tenantId} AND id = ANY(${db.array(ids, 2950)})
  `;
}

async function priorProductSummary(db: Db, tenantId: string, productType: string): Promise<string | null> {
  const rows = await db<{ title: string; key_judgments: string[]; created_at: string }[]>`
    SELECT title, key_judgments, created_at
    FROM products
    WHERE tenant_id = ${tenantId} AND product_type = ${productType}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0]!;
  const kj = (r.key_judgments ?? []).slice(0, 5).map((s) => `- ${String(s)}`).join("\n");
  return `Title: ${r.title}\nCreatedAt: ${r.created_at}\nKeyJudgments:\n${kj}`;
}

export async function generateProduct(db: Db, payload: GenerateProductJobPayload) {
  const enabled = (process.env.FEATURE_PRODUCT_FACTORY ?? "false").trim().toLowerCase() === "true";
  if (!enabled) throw new Error("FEATURE_PRODUCT_FACTORY is not enabled");

  const tenantId = payload.tenantId;
  const productType = String(payload.productType ?? "").trim();
  if (!tenantId || !productType) throw new Error("tenantId and productType are required");

  await ensureSeeded(db, tenantId);

  const startedAt = new Date().toISOString();
  const runId = randomUUID();
  const actor = payload.actorUserId ?? null;

  await db`
    INSERT INTO run_logs (id, tenant_id, kind, status, model, input)
    VALUES (${runId}, ${tenantId}, ${"products.generate"}, ${"started"}, ${null}, ${db.json({ productType, signalId: payload.signalId ?? null, startedAt })})
  `;

  try {
    const { cfg, prompt } = await loadConfig(db, tenantId, productType);

    const evidence = await evidenceForJob(db, payload, cfg);
    if (!evidence.length) throw new Error("No evidence found for scope");

    const entities = await entitiesForEvidence(db, tenantId, evidence.map((e) => e.id));
    const requireReview = entities.some((e) => e.type === "PERSON" || Boolean(e.pii_flag));

    const conf = computeConfidence(evidence);

    // Blinded evidence references (EVD-###)
    const evidenceMap = evidence.map((e, i) => ({ ref: evidenceRef(i), evidence: e }));
    const allowedRefs = new Set(evidenceMap.map((x) => x.ref));

    const evidenceForLlm = evidenceMap.map(({ ref, evidence }) => ({
      ref,
      title: sanitizeEvidenceText(evidence.title ?? ""),
      summary: sanitizeEvidenceText(evidence.summary ?? ""),
      excerpt: sanitizeEvidenceText(evidence.content_text ?? ""),
      tags: (evidence.tags ?? []).map(String).map((t) => t.trim()).filter(Boolean).slice(0, 15),
    }));

    const prior = await priorProductSummary(db, tenantId, productType);
    const requireChangeFromLast = Boolean(prior);

    let raw: unknown;
    const provider = llmProvider();
    if (provider === "openai") {
      raw = await generateWithOpenAi({
        productName: cfg.name,
        promptText: prompt?.prompt_text ?? "Generate a structured intelligence product JSON object.",
        evidenceRefs: evidenceForLlm,
        requireChangeFromLast,
        priorSummary: prior ?? undefined,
      });
    } else {
      raw = mockGenerateProduct({
        productName: cfg.name,
        evidenceRefs: evidenceMap.map((x) => x.ref),
        requireChangeFromLast,
      });
    }

    const validated = validateGeneratedProductJson(raw, allowedRefs, requireChangeFromLast);
    if (!validated.ok) throw new Error(`LLM output invalid: ${validated.error}`);
    const gen: GeneratedProductJson = validated.value;

    // Evidence-bound enforcement: map evidenceRefs back to UUIDs.
    const refToId = new Map<string, string>(evidenceMap.map((x) => [x.ref, x.evidence.id]));
    const evidenceIds = Array.from(
      new Set(gen.evidenceRefs.map((r) => refToId.get(r)).filter((x): x is string => Boolean(x))),
    );

    const entityIds = entities.map((e) => e.id);

    // Render standardized product markdown using template_markdown.
    const evidenceBullets = evidenceMap.map(({ ref, evidence }) => {
      const title = (evidence.title ?? evidence.summary ?? "").toString().trim().slice(0, 140) || "(untitled)";
      return `${ref} — ${title}`;
    });

    const markdown = renderTemplate({
      template: cfg.template_markdown ?? "",
      title: gen.title,
      keyJudgments: gen.keyJudgments,
      evidenceBullets,
      confidenceLevel: conf.level,
      confidenceRationale: conf.rationale,
      likelihoodTerm: gen.likelihood.term,
      likelihoodMin: gen.likelihood.min,
      likelihoodMax: gen.likelihood.max,
      riskLikelihood: gen.risk.likelihood,
      riskImpact: gen.risk.impact,
      bodyMarkdown: gen.bodyMarkdown,
      indicators: gen.indicators,
      actions: gen.actions,
      changeFromLast: gen.changeFromLast,
    });

    const productId = randomUUID();
    await db.begin(async (tx) => {
      await tx`
        INSERT INTO products (
          id, tenant_id, product_type, title, status,
          confidence_level, confidence_rationale,
          likelihood_term, likelihood_min, likelihood_max,
          risk_likelihood, risk_impact,
          key_judgments, indicators, change_from_last,
          content_markdown, content_json,
          evidence_ids, entity_ids,
          created_by_user_id
        ) VALUES (
          ${productId},
          ${tenantId},
          ${cfg.product_type},
          ${gen.title},
          ${requireReview ? "in_review" : "draft"},
          ${conf.level},
          ${conf.rationale},
          ${gen.likelihood.term},
          ${gen.likelihood.min},
          ${gen.likelihood.max},
          ${gen.risk.likelihood},
          ${gen.risk.impact},
          ${tx.array(gen.keyJudgments, 1009)},
          ${tx.array(gen.indicators, 1009)},
          ${gen.changeFromLast ?? null},
          ${markdown},
          ${tx.json({
            generated: gen,
            evidenceRefMap: evidenceMap.map((x) => ({ ref: x.ref, evidenceId: x.evidence.id })),
            requireReview,
          })},
          ${tx.array(evidenceIds, 2950)},
          ${tx.array(entityIds, 2950)},
          ${actor}
        )
      `;

      for (const a of gen.actions) {
        await tx`
          INSERT INTO action_items (id, tenant_id, product_id, owner, due_at, status, title, notes)
          VALUES (
            ${randomUUID()},
            ${tenantId},
            ${productId},
            ${a.owner},
            ${a.deadline},
            ${"open"},
            ${a.title},
            ${a.notes ?? null}
          )
        `;
      }

      await tx`
        INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
        VALUES (
          ${randomUUID()},
          ${tenantId},
          ${"product.generated"},
          ${actor},
          ${"product"},
          ${productId},
          ${tx.json({
            productType: cfg.product_type,
            requireReview,
            evidenceCount: evidenceIds.length,
            entityCount: entityIds.length,
            confidence: conf,
          })}
        )
      `;
    });

    await db`
      UPDATE run_logs
      SET status = ${"succeeded"},
          model = ${provider === "openai" ? (process.env.OPENAI_MODEL ?? "gpt-5.2") : "mock"},
          prompt_version_id = ${cfg.prompt_version_id},
          output = ${db.json({ productId, productType: cfg.product_type, requireReview })}
      WHERE id = ${runId}
    `;

    return { ok: true, productId };
  } catch (err) {
    const message = String((err as any)?.message ?? err);
    await db`
      UPDATE run_logs
      SET status = ${"failed"},
          error = ${message}
      WHERE id = ${runId}
    `;
    throw err;
  }
}


