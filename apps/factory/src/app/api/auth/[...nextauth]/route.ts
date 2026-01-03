import NextAuth from "next-auth";

import { getAuthOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IMPORTANT: Next.js evaluates route modules at build time. Keep env-required code lazy (request-time),
// but still pass the route context (ctx.params.nextauth) that next-auth needs in App Router.
export function GET(req: Request, ctx: any) {
  return NextAuth(getAuthOptions())(req as any, ctx as any);
}

export function POST(req: Request, ctx: any) {
  return NextAuth(getAuthOptions())(req as any, ctx as any);
}


