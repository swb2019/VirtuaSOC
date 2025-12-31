# Report exports (Markdown + JSON)

VirtuaSOC supports exporting a report as:
- **Markdown** (`.md`) for human-readable sharing/editing
- **JSON** (`.json`) for archiving or downstream integrations

Exports are **tenant-scoped** and require an authenticated tenant user (OIDC / local) with at least the `gsoc_analyst` role.

## Web UI
1. Open a report (e.g., **Reports → select a report**).
2. Use:
   - **Download MD**
   - **Download JSON**

If the report hasn’t been rendered yet, the export endpoints will render and persist `full_markdown` automatically.

## API endpoints
- **Markdown export**:
  - `GET /api/reports/:id/export/markdown`
  - Response: `{ ok: true, markdown: string }`

- **JSON export**:
  - `GET /api/reports/:id/export/json`
  - Response: `{ ok: true, generatedAt, report, sections, evidence }`

## Notes
- JSON export includes the report row, its sections, and the referenced evidence items (id/title/summary/source_uri).
- Exports are recorded in the tenant audit log (`report.exported.*`).


