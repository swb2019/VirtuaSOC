import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { getAuthOptions } from "@/lib/auth";
import { env } from "@/env";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  if (!env.featureFactoryApp) redirect("/");

  const session = await getServerSession(getAuthOptions());
  if (session?.user?.id) redirect("/");

  return (
    <div className="mx-auto max-w-5xl py-10">
      <LoginClient />
    </div>
  );
}


