export default function Home() {
  const enabled = process.env.FEATURE_FACTORY_APP === "true";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="text-lg font-semibold">Intelligence Product Factory</div>
        <div className="mt-2 text-sm text-zinc-400">
          M0 scaffold is live. Next: Auth + tenancy + RBAC (Entra SSO).
        </div>
        <div className="mt-6 grid gap-3 text-sm">
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div className="font-semibold text-zinc-200">Status</div>
            <div className="mt-1 text-zinc-400">
              This is the new Next.js app that will replace the legacy Vite UI over time.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div className="font-semibold text-zinc-200">Feature flags</div>
            <div className="mt-1 text-zinc-400">
              Modules are shipped behind flags (AMD). Current: <code>FEATURE_FACTORY_APP</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
