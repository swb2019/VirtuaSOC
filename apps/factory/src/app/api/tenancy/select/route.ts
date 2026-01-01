import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getAuthOptions } from "@/lib/auth";
import { prismaControl } from "@/lib/prismaControl";
import { TENANT_COOKIE } from "@/lib/tenancy";
import { env } from "@/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!env.featureFactoryApp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = String(body?.slug ?? "").trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const tenant = await prismaControl().tenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  const membership = await prismaControl().membership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = NextResponse.json({ ok: true, slug });
  res.cookies.set(TENANT_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}


