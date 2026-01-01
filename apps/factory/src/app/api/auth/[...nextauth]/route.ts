import NextAuth from "next-auth";

import { getAuthOptions } from "@/lib/auth";

export const runtime = "nodejs";

function handler() {
  return NextAuth(getAuthOptions());
}

export const GET = (req: Request) => handler()(req);
export const POST = (req: Request) => handler()(req);


