import { NextResponse } from "next/server";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";

function safeFilename(raw: string): string {
  const s = raw.trim().slice(0, 80) || "product";
  return s.replace(/[^\w\-(). ]+/g, "_");
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!env.featureFactoryApp || !env.featureRbac || !env.featureProductFactory || !env.featureReviewDistribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const p = await ctx.params;
  const productId = String(p?.id ?? "").trim();
  if (!productId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { tenant, tenantDb } = await requireTenantDb("VIEWER");
  const product = await tenantDb.product.findFirst({ where: { tenantId: tenant.id, id: productId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exp = await tenantDb.productExport.findUnique({ where: { productId: product.id } });
  if (!exp?.pdfBytes) return NextResponse.json({ error: "PDF not available yet. Click Generate PDF first." }, { status: 404 });

  const filename = `${safeFilename(product.title)}.pdf`;
  return new NextResponse(exp.pdfBytes, {
    headers: {
      "content-type": exp.contentType ?? "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}


