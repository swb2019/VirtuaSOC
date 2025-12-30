import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./auth";
import { AdminLoginPage } from "./pages/admin/AdminLogin";
import { AdminOidcCallbackPage } from "./pages/admin/AdminOidcCallback";
import { AdminAuditPage } from "./pages/admin/AdminAudit";
import { AdminTenantDetailPage } from "./pages/admin/AdminTenantDetail";
import { AdminTenantsPage } from "./pages/admin/AdminTenants";
import { EvidencePage } from "./pages/Evidence";
import { LoginPage } from "./pages/Login";
import { NewReportPage } from "./pages/NewReport";
import { OidcCallbackPage } from "./pages/OidcCallback";
import { ReportDetailPage } from "./pages/ReportDetail";
import { ReportsPage } from "./pages/Reports";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { adminToken } = useAuth();
  const loc = useLocation();
  if (!adminToken) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export function App() {
  const { token, setToken, setAdminToken } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/oidc/callback" element={<AdminOidcCallbackPage />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdminAuth>
              <div className="min-h-screen bg-slate-950 text-slate-100">
                <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400" />
                      <div>
                        <div className="text-sm font-semibold tracking-wide text-slate-100">VirtuaSOC</div>
                        <div className="text-xs text-slate-400">Tenant Administration</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAdminToken(null);
                          nav("/admin/login");
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </header>

                <div className="mx-auto max-w-7xl px-6 py-8">
                  <Routes>
                    <Route path="/admin" element={<Navigate to="/admin/tenants" replace />} />
                    <Route path="/admin/tenants" element={<AdminTenantsPage />} />
                    <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
                    <Route path="/admin/audit" element={<AdminAuditPage />} />
                    <Route path="*" element={<Navigate to="/admin/tenants" replace />} />
                  </Routes>
                </div>
              </div>
            </RequireAdminAuth>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/oidc/callback" element={<OidcCallbackPage />} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="min-h-screen bg-slate-950 text-slate-100">
                <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400" />
                      <div>
                        <div className="text-sm font-semibold tracking-wide text-slate-100">VirtuaSOC</div>
                        <div className="text-xs text-slate-400">Analyst Workbench</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setToken(null);
                          nav("/login");
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </header>

                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
                  <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <nav className="grid gap-1 text-sm">
                      <Link to="/reports" className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-900/60">
                        Reports
                      </Link>
                      <Link to="/evidence" className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-900/60">
                        Evidence
                      </Link>
                    </nav>
                  </aside>

                  <main>
                    <Routes>
                      <Route path="/" element={<Navigate to="/reports" replace />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/reports/new" element={<NewReportPage />} />
                      <Route path="/reports/:id" element={<ReportDetailPage />} />
                      <Route path="/evidence" element={<EvidencePage />} />
                      <Route path="*" element={<Navigate to="/reports" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}
