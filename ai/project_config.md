# VirtuaSOC Project Config
## Tech Stack
- Runtime: Node.js 20
- Language: TypeScript
- Tests: Vitest (`pnpm test`)
- Package manager: pnpm
## Repository Layout
- `app/modules/<module>/SPEC.md`  requirements + acceptance criteria
- `app/modules/<module>/CONTRACT.md`  public API and invariants
- `app/modules/<module>/src`  implementation
- `app/modules/<module>/tests`  tests
- `app/modules/<module>/docs`  module-level docs
- `docs/architecture`  C4 diagrams, system views
- `docs/adr`  Architecture Decision Records
- `interfaces`  shared TS interfaces and types
- `ai/workflow_state.<module>.md`  per-module autonomous state machine
## Architectural Conventions
- Each module is as self-contained as possible.
- Cross-module dependencies go through explicit contracts and shared interfaces.
- Architecture and contracts are owned by ARCHITECT agents, not Builders.
## Testing Policy
- All public module functions must be covered by Vitest tests.
- `pnpm test` must pass for any branch before merging.
- Modules should keep tests close to their implementation (`tests` next to `src`).
## Security Policy (High-level)
- Do not hardcode secrets, tokens, or credentials.
- Do not introduce `eval` / dynamic code loading without strong justification + tests.
- Do not bypass authentication or input validation layers in future modules.
- Handle logs in a privacy-conscious way; avoid sensitive data in logs.
