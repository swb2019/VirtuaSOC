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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getReport(id)
      .then((r) => {
        setReport(r.report);
        setSections(r.sections);
        setMarkdown(r.report.full_markdown ?? "");
      })
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [api, id]);

  async function saveSection(sectionId: string, contentMarkdown: string) {
    if (!id) return;
    await api.updateReportSection(id, sectionId, { contentMarkdown });
  }

  async function render() {
    if (!id) return;
    const res = await api.renderReport(id);
    setMarkdown(res.markdown);
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
                onClick={() => submit().catch((e) => setErr(String(e?.message ?? e)))}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Submit
              </button>
              <button
                onClick={() => approve().catch((e) => setErr(String(e?.message ?? e)))}
                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-700"
              >
                Approve
              </button>
            </div>
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


