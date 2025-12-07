# Autopilot Protocol (Cursor Background Agents)

A “module capsule” is complete when:
- SPEC.md updated with acceptance criteria
- CONTRACT.md updated with explicit API boundaries
- Implementation in src/
- Tests in tests/ are green (`pnpm test`)
- Minimal docs in docs/README.md

Logging:
- If blocked: write to ai/AUTOPILOT_LOG.md and stop.
- Otherwise: summarize changes at bottom of ai/AUTOPILOT_LOG.md.

Forbidden:
- Editing .github/workflows/** or .cursor/rules/**

Merge policy:
- Cursor PRs are auto-merged only if CI + Security checks pass and forbidden paths weren’t touched.
