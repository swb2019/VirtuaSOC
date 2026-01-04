import { NextResponse } from "next/server";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";

export async function GET() {
  if (!env.featureFactoryApp || !env.featureRbac || !env.featureProductFactory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { tenant, tenantDb } = await requireTenantDb("ADMIN");
  const tpl = await tenantDb.tenantDocxTemplate.findUnique({ where: { tenantId: tenant.id } }).catch(() => null);
  if (!tpl?.docxBytes) return NextResponse.json({ error: "No DOCX template configured." }, { status: 404 });

  const filename = `tenant_${tenant.slug}_reference.docx`;
  return new NextResponse(tpl.docxBytes, {
    headers: {
      "content-type":
        tpl.contentType ?? "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename=\"${filename}\"`,
      "cache-control": "no-store",
    },
  });
}


