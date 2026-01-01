# AI Setup Assistant (OpenAI GPT-5.2)

VirtuaSOC includes an **in-app Setup Assistant** that can auto-configure tenant setup, including:
- RSS feeds (add/remove/enable/disable)
- RSS ingest defaults (default tags + auto-triage)
- Distribution targets (email targets + per-tenant Teams webhook)

It’s available in:
- Tenant UI: `/setup`
- Admin UI: Tenant → **Setup Assistant**

## 1) Configure secrets / env

### Required
- `OPENAI_API_KEY`: your OpenAI API key

### Recommended
- `OPENAI_MODEL=gpt-5.2`
- `AI_SETUP_ENABLED=true`

### Cost-control knobs
- `AI_SETUP_MAX_TOOL_CALLS` (default `5`)
- `AI_SETUP_MAX_OUTPUT_TOKENS` (default `600`)
- `AI_SETUP_MAX_REQUESTS_PER_TENANT_PER_DAY` (default `50`)

Optional:
- `OPENAI_BASE_URL` (defaults to `https://api.openai.com/v1`)

## 2) Tenant DB migrations
Tenant DB migrations are auto-applied by the API (budget mode default). The assistant stores tenant configuration in tenant-plane tables:
- `ingest_prefs`
- `distribution_targets`

## 3) What it can change (auto-apply scope)
The assistant is intentionally constrained to safe configuration operations:
- RSS feeds table (`rss_feeds`)
- Ingest prefs (`ingest_prefs`)
- Distribution targets (`distribution_targets`)

All changes are written through an allowlisted tool set and recorded in the tenant audit log.

## 4) Notes / safety
- The assistant is designed to operate on **setup/configuration** only.\n+- Don’t paste sensitive information unless you intend for it to be stored (e.g., Teams webhook URL).\n+- If you hit the daily cap, the API returns HTTP `429` with `Retry-After`.


