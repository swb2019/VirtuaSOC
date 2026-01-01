"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function LoginClient() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? undefined;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="text-lg font-semibold">Sign in</div>
        <div className="mt-2 text-sm text-zinc-400">Use your organization account (Microsoft Entra ID).</div>

        <button
          onClick={() => signIn("azure-ad", { callbackUrl })}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Sign in with Entra
        </button>
      </div>
    </div>
  );
}


