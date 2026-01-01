import { cookies, headers } from "next/headers";

const TENANT_COOKIE = "vsoc_tenant_slug";

function isIpHost(parts: string[]) {
  return parts.length === 4 && parts.every((p) => /^\d+$/.test(p));
}

export function deriveTenantSlugFromHost(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  if (host === "localhost") return null;

  const parts = host.split(".").filter(Boolean);
  if (!parts.length) return null;
  if (isIpHost(parts)) return null;

  // Base host: factory.app.example.com (not a tenant)
  if (parts.length >= 3 && parts[0] === "factory" && parts[1] === "app") return null;

  // Tenant host: tenantSlug.factory.app.example.com
  if (parts.length >= 4 && parts[1] === "factory" && parts[2] === "app") {
    const candidate = parts[0] ?? "";
    if (!candidate) return null;
    if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(candidate)) return null;
    return candidate;
  }

  return null;
}

export async function getActiveTenantSlug(): Promise<string | null> {
  // 1) Host-based tenant
  const h = await headers();
  const host = h.get("host") ?? "";
  const byHost = deriveTenantSlugFromHost(host);
  if (byHost) return byHost;

  // 2) Cookie-based tenant selection
  const c = await cookies();
  const byCookie = c.get(TENANT_COOKIE)?.value ?? "";
  const slug = byCookie.trim().toLowerCase();
  if (slug && /^[a-z0-9][a-z0-9-]{0,31}$/.test(slug)) return slug;

  // 3) Explicit header (useful for API calls / dev)
  const byHeader = (h.get("x-tenant-slug") ?? "").trim().toLowerCase();
  if (byHeader && /^[a-z0-9][a-z0-9-]{0,31}$/.test(byHeader)) return byHeader;

  return null;
}

export { TENANT_COOKIE };


