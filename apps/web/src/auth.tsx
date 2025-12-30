import React, { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "virtuasoc_access_token";
const TENANT_KEY = "virtuasoc_tenant_slug";

function deriveTenantSlugFromHost(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const parts = host.split(".").filter(Boolean);
  if (parts.length < 3) return null;

  // Handle nip.io: 34.12.56.78.nip.io (no tenant) vs tenant.34.12.56.78.nip.io
  const isNip = parts.slice(-2).join(".") === "nip.io";
  if (isNip && parts.length === 6 && parts.slice(0, 4).every((p) => /^\d+$/.test(p))) return null;

  // Exclude raw IPv4 hostnames like 34.12.56.78
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) return null;

  const candidate = parts[0] ?? null;
  if (!candidate) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(candidate)) return null;
  return candidate;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [tenantSlug, setTenantSlugState] = useState<string>(() => {
    return (
      localStorage.getItem(TENANT_KEY) ??
      deriveTenantSlugFromHost(window.location.hostname) ??
      "demo"
    );
  });

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const setTenantSlug = (slug: string) => {
    const s = slug.trim().toLowerCase();
    setTenantSlugState(s);
    localStorage.setItem(TENANT_KEY, s);
  };

  const value = useMemo(() => ({ token, setToken, tenantSlug, setTenantSlug }), [token, tenantSlug]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}


