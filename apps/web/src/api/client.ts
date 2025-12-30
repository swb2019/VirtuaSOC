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

  async createReport(definitionId: string, title?: string) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ definitionId, title }),
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

  async listEvidence(q?: string) {
    const url = new URL("/api/evidence", window.location.origin);
    if (q) url.searchParams.set("q", q);
    const res = await fetch(url.toString().replace(window.location.origin, ""), { headers: this.headers() });
    if (!res.ok) throw new Error(`list evidence failed: ${res.status}`);
    return (await res.json()) as { evidence: any[] };
  }
}


