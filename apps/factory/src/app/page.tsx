import { env } from "@/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const enabled = env.featureFactoryApp;

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Intelligence Product Factory</div>
          <div className="mt-2 text-sm text-zinc-400">
            The new Factory app is deployed but currently disabled.
          </div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_FACTORY_APP=true</code> to enable.
          </div>
        </div>
      </div>
    );
  }

  if (!env.featureRbac) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Intelligence Product Factory</div>
          <div className="mt-2 text-sm text-zinc-400">
            M1 (Auth + tenancy + RBAC) is not enabled yet.
          </div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_RBAC=true</code> to enable sign-in + tenant selection.
          </div>
        </div>
      </div>
    );
  }

  // M1: if enabled, render a minimal authenticated entry point.
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="text-lg font-semibold">Intelligence Product Factory</div>
        <div className="mt-2 text-sm text-zinc-400">
          Auth + tenancy is now wired via NextAuth (Entra).
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in
          </a>
          <a
            href="/tenants"
            className="rounded-lg border border-zinc-800 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Choose tenant
          </a>
        </div>
      </div>
    </div>
  );
}
