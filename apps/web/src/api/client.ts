export type ApiClientOpts = {
  token?: string;
  tenantSlug?: string;
};

export class ApiClient {
  private token?: string;
  private tenantSlug?: string;

  constructor(opts: ApiClientOpts) {
    this.token = opts.token;
    this.tenantSlug = opts.tenantSlug;
  }

  private headers() {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    if (this.tenantSlug) h["x-tenant-slug"] = this.tenantSlug;
    return h;
  }

  async health() {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error(`health failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async tenantHealth() {
    const res = await fetch("/api/tenant/health", { headers: this.headers() });
    if (!res.ok) throw new Error(`tenant health failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; tenant: string };
  }

  async oidcConfig() {
    const res = await fetch("/api/auth/oidc/config", { headers: this.headers() });
    if (!res.ok) throw new Error(`oidc config failed: ${res.status}`);
    return (await res.json()) as {
      issuer: string;
      clientId: string;
      scopes: string;
      roleClaimPath: string;
    };
  }

  async reportDefinitions() {
    const res = await fetch("/api/report-definitions", { headers: this.headers() });
    if (!res.ok) throw new Error(`report definitions failed: ${res.status}`);
    return (await res.json()) as { definitions: { id: string; title: string; description: string }[] };
  }

  async listReports() {
    const res = await fetch("/api/reports", { headers: this.headers() });
    if (!res.ok) throw new Error(`list reports failed: ${res.status}`);
    return (await res.json()) as { reports: any[] };
  }

  async createReport(definitionId: string, title?: string, evidenceIds?: string[]) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ definitionId, title, evidenceIds }),
    });
    if (!res.ok) throw new Error(`create report failed: ${res.status}`);
    return (await res.json()) as { id: string };
  }

  async getReport(id: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`get report failed: ${res.status}`);
    return (await res.json()) as { report: any; sections: any[] };
  }

  async updateReportSection(reportId: string, sectionId: string, patch: { contentMarkdown?: string; evidenceIds?: string[] }) {
    const res = await fetch(
      `/api/reports/${encodeURIComponent(reportId)}/sections/${encodeURIComponent(sectionId)}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(patch),
      },
    );
    if (!res.ok) throw new Error(`update section failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async renderReport(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/render`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`render report failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; markdown: string };
  }

  async submitReport(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/submit`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`submit report failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async approveReport(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/approve`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`approve report failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async listDistributions(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/distributions`, { headers: this.headers() });
    if (!res.ok) throw new Error(`list distributions failed: ${res.status}`);
    return (await res.json()) as {
      distributions: { id: string; createdAt: string; channel: string; target: string; status: string; sentAt: string | null; error: string | null }[];
    };
  }

  async distributeReport(reportId: string, body: { channel: "email" | "teams"; target?: string; subject?: string }) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/distribute`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`distribute report failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; distributionId: string };
  }

  async exportReportMarkdown(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/export/markdown`, { headers: this.headers() });
    if (!res.ok) throw new Error(`export markdown failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; markdown: string };
  }

  async exportReportJson(reportId: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/export/json`, { headers: this.headers() });
    if (!res.ok) throw new Error(`export json failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; generatedAt: string; report: any; sections: any[]; evidence: any[] };
  }

  async assistantChat(messages: { role: "user" | "assistant"; content: string }[]) {
    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`assistant chat failed: ${res.status}`);
    return (await res.json()) as {
      reply: string;
      appliedActions: { tool: string; input: unknown; output: unknown }[];
    };
  }

  async listEvidence(opts?: { q?: string; status?: "new" | "triaged"; tag?: string }) {
    const url = new URL("/api/evidence", window.location.origin);
    if (opts?.q) url.searchParams.set("q", opts.q);
    if (opts?.status) url.searchParams.set("status", opts.status);
    if (opts?.tag) url.searchParams.set("tag", opts.tag);
    const res = await fetch(url.toString().replace(window.location.origin, ""), { headers: this.headers() });
    if (!res.ok) throw new Error(`list evidence failed: ${res.status}`);
    return (await res.json()) as { evidence: any[] };
  }

  async updateEvidence(id: string, patch: { triageStatus?: "new" | "triaged"; tags?: string[] }) {
    const res = await fetch(`/api/evidence/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`update evidence failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async listRssFeeds() {
    const res = await fetch("/api/rss-feeds", { headers: this.headers() });
    if (!res.ok) throw new Error(`list rss feeds failed: ${res.status}`);
    return (await res.json()) as { feeds: { id: string; createdAt: string; url: string; title: string | null; enabled: boolean }[] };
  }

  async addRssFeed(url: string, title?: string) {
    const res = await fetch("/api/rss-feeds", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ url, title }),
    });
    if (!res.ok) throw new Error(`add rss feed failed: ${res.status}`);
    return (await res.json()) as { id: string; inserted: boolean };
  }

  async updateRssFeed(id: string, patch: { enabled?: boolean; title?: string }) {
    const res = await fetch(`/api/rss-feeds/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`update rss feed failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }

  async deleteRssFeed(id: string) {
    const res = await fetch(`/api/rss-feeds/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`delete rss feed failed: ${res.status}`);
    return (await res.json()) as { ok: boolean };
  }
}

export type AdminApiClientOpts = {
  token?: string;
};

export class AdminApiClient {
  private token?: string;

  constructor(opts: AdminApiClientOpts) {
    this.token = opts.token;
  }

  private headers() {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  async platformOidcConfig() {
    const res = await fetch("/api/admin/auth/oidc/config");
    if (!res.ok) throw new Error(`platform oidc config failed: ${res.status}`);
    return (await res.json()) as { issuer: string; clientId: string; scopes: string; roleClaimPath: string };
  }

  async listAudit(limit = 100, offset = 0) {
    const url = new URL("/api/admin/audit", window.location.origin);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    const res = await fetch(url.toString().replace(window.location.origin, ""), { headers: this.headers() });
    if (!res.ok) throw new Error(`audit failed: ${res.status}`);
    return (await res.json()) as {
      events: any[];
      limit: number;
      offset: number;
      nextOffset: number;
    };
  }

  async listTenants() {
    const res = await fetch("/api/admin/tenants", { headers: this.headers() });
    if (!res.ok) throw new Error(`list tenants failed: ${res.status}`);
    return (await res.json()) as { tenants: { id: string; slug: string; name: string; createdAt: string }[] };
  }

  async createTenant(body: {
    slug: string;
    name: string;
    oidc?: {
      issuer: string;
      clientId: string;
      scopes?: string;
      roleClaimPath?: string;
      roleMapping?: Record<string, string>;
    };
  }) {
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`create tenant failed: ${res.status}`);
    return (await res.json()) as { tenant: { id: string; slug: string; name: string; dbName: string; dbUser: string } };
  }

  async getTenant(id: string) {
    const res = await fetch(`/api/admin/tenants/${encodeURIComponent(id)}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`get tenant failed: ${res.status}`);
    return (await res.json()) as {
      tenant: { id: string; slug: string; name: string; createdAt: string };
      oidc:
        | {
            issuer: string;
            clientId: string;
            scopes: string;
            roleClaimPath: string;
            audience: string | null;
            enforceAudience: boolean;
            roleMapping: Record<string, string>;
          }
        | null;
    };
  }

  async updateTenant(
    id: string,
    body: {
      name?: string;
      oidc?:
        | {
            issuer: string;
            clientId: string;
            scopes?: string;
            roleClaimPath?: string;
            audience?: string;
            enforceAudience?: boolean;
            roleMapping?: Record<string, string>;
          }
        | null;
    },
  ) {
    const res = await fetch(`/api/admin/tenants/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`update tenant failed: ${res.status}`);
    return (await res.json()) as {
      tenant: { id: string; slug: string; name: string; createdAt: string };
      oidc:
        | {
            issuer: string;
            clientId: string;
            scopes: string;
            roleClaimPath: string;
            audience: string | null;
            enforceAudience: boolean;
            roleMapping: Record<string, string>;
          }
        | null;
    };
  }

  async assistantChat(tenantId: string, messages: { role: "user" | "assistant"; content: string }[]) {
    const res = await fetch("/api/admin/assistant/chat", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tenantId, messages }),
    });
    if (!res.ok) throw new Error(`admin assistant chat failed: ${res.status}`);
    return (await res.json()) as {
      reply: string;
      appliedActions: { tool: string; input: unknown; output: unknown }[];
    };
  }
}


