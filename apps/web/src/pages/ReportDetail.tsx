import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ApiClient } from "../api/client";
import { useAuth } from "../auth";

export function ReportDetailPage() {
  const { id } = useParams();
  const { token, tenantSlug } = useAuth();
  const api = useMemo(() => new ApiClient({ token: token ?? undefined, tenantSlug }), [token, tenantSlug]);

  const [report, setReport] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [markdown, setMarkdown] = useState<string>("");
  const [distributions, setDistributions] = useState<any[]>([]);
  const [distChannel, setDistChannel] = useState<"teams" | "email">("teams");
  const [distTarget, setDistTarget] = useState<string>("");
  const [distSubject, setDistSubject] = useState<string>("");
  const [distSending, setDistSending] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getReport(id)
      .then((r) => {
        setReport(r.report);
        setSections(r.sections);
        setMarkdown(r.report.full_markdown ?? "");
        setDistSubject((r.report?.title ?? "").toString());
      })
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, id]);

  useEffect(() => {
    if (!id) return;
    api
      .listDistributions(id)
      .then((r) => setDistributions(r.distributions))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, id]);

  async function refreshDistributions() {
    if (!id) return;
    const r = await api.listDistributions(id);
    setDistributions(r.distributions);
  }

  async function saveSection(sectionId: string, contentMarkdown: string) {
    if (!id) return;
    await api.updateReportSection(id, sectionId, { contentMarkdown });
  }

  async function render() {
    if (!id) return;
    const res = await api.renderReport(id);
    setMarkdown(res.markdown);
  }

  function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadMarkdown() {
    if (!id || !report) return;
    const res = await api.exportReportMarkdown(id);
    const fname = `${(report.title ?? "report").toString().replace(/[^\w.-]+/g, "_")}.md`;
    downloadBlob(fname, new Blob([res.markdown ?? ""], { type: "text/markdown;charset=utf-8" }));
  }

  async function downloadJson() {
    if (!id || !report) return;
    const res = await api.exportReportJson(id);
    const fname = `${(report.title ?? "report").toString().replace(/[^\w.-]+/g, "_")}.json`;
    const text = JSON.stringify(res, null, 2);
    downloadBlob(fname, new Blob([text], { type: "application/json;charset=utf-8" }));
  }

  async function submit() {
    if (!id) return;
    await api.submitReport(id);
    const r = await api.getReport(id);
    setReport(r.report);
  }

  async function approve() {
    if (!id) return;
    await api.approveReport(id);
    const r = await api.getReport(id);
    setReport(r.report);
  }

  async function distribute() {
    if (!id || !report) return;
    setErr(null);

    if (report.status !== "approved") {
      throw new Error("Report must be approved before distribution.");
    }

    const subject = distSubject.trim() || report.title || "VirtuaSOC Report";
    const body =
      distChannel === "email"
        ? { channel: "email" as const, target: distTarget.trim(), subject }
        : { channel: "teams" as const, subject };

    if (distChannel === "email" && !distTarget.trim()) {
      throw new Error("Email target is required.");
    }

    setDistSending(true);
    try {
      await api.distributeReport(id, body);
      await refreshDistributions();
      // worker sends async; refresh shortly after too
      setTimeout(() => refreshDistributions().catch(() => {}), 2500);
    } finally {
      setDistSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {err ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</div> : null}

      {report ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{report.title}</div>
              <div className="text-sm text-slate-400">
                {report.definition_id} • {report.status} • {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => render().catch((e) => setErr(String(e?.message ?? e)))}
                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
              >
                Render
              </button>
              <button
                onClick={() => downloadMarkdown().catch((e) => setErr(String(e?.message ?? e)))}
                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
              >
                Download MD
              </button>
              <button
                onClick={() => downloadJson().catch((e) => setErr(String(e?.message ?? e)))}
                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
              >
                Download JSON
              </button>
              <button
                onClick={() => submit().catch((e) => setErr(String(e?.message ?? e)))}
                disabled={report.status !== "draft"}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Submit
              </button>
              <button
                onClick={() => approve().catch((e) => setErr(String(e?.message ?? e)))}
                disabled={report.status !== "in_review"}
                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-200">Distribution</div>
              <div className="mt-1 text-xs text-slate-500">
                Default policy: distribution requires <code>approved</code>.
              </div>
            </div>
            <button
              onClick={() => refreshDistributions().catch((e) => setErr(String(e?.message ?? e)))}
              className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-400">Channel</label>
              <select
                value={distChannel}
                onChange={(e) => setDistChannel(e.target.value as any)}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              >
                <option value="teams">Teams</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-400">Target</label>
              <input
                value={distTarget}
                onChange={(e) => setDistTarget(e.target.value)}
                placeholder={distChannel === "email" ? "user@example.com" : "(uses server TEAMS_WEBHOOK_URL)"}
                disabled={distChannel !== "email"}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 disabled:opacity-60"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-400">Subject</label>
              <input
                value={distSubject}
                onChange={(e) => setDistSubject(e.target.value)}
                placeholder={report.title}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => distribute().catch((e) => setErr(String(e?.message ?? e)))}
              disabled={distSending || report.status !== "approved"}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {distSending ? "Queueing…" : "Distribute"}
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/60 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                {distributions.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-slate-400">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-200">{d.channel}</td>
                    <td className="px-4 py-3 text-slate-300">{d.target}</td>
                    <td className="px-4 py-3 text-slate-200">
                      <div className="flex flex-col">
                        <div>{d.status}</div>
                        {d.error ? <div className="mt-1 text-xs text-rose-300">{d.error}</div> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!distributions.length ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      No distribution activity yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-200">Sections</div>
          {sections.map((s) => (
            <SectionEditor
              key={s.id}
              section={s}
              onSave={(content) => saveSection(s.id, content)}
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-200">Rendered Markdown</div>
          <pre className="whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
            {markdown || "(render to preview)"}
          </pre>
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onSave,
}: {
  section: any;
  onSave: (contentMarkdown: string) => Promise<void>;
}) {
  const [value, setValue] = useState<string>(section.content_markdown ?? "");
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setValue(section.content_markdown ?? "");
  }, [section.content_markdown]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{section.title}</div>
        <button
          onClick={() => {
            setSaving(true);
            setErr(null);
            onSave(value)
              .catch((e) => setErr(String(e?.message ?? e)))
              .finally(() => setSaving(false));
          }}
          disabled={saving}
          className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {err ? <div className="mt-2 text-xs text-rose-300">{err}</div> : null}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-100 placeholder:text-slate-600"
      />
    </div>
  );
}


