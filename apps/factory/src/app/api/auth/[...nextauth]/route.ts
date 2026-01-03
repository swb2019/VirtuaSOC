import NextAuth from "next-auth";

import { getAuthOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IMPORTANT: export the NextAuth handler directly so Next.js passes the route context
// (ctx.params.nextauth) required by next-auth in App Router.
const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };


