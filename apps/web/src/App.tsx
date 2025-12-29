import { Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="text-lg font-semibold">VirtuaSOC</div>
              <div className="mt-2 text-sm text-slate-300">
                Web UI will be re-added after the SaaS API + worker are rebuilt.
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
