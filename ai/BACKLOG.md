<!-- AMD-MANAGED:BACKLOG v1 -->
# VirtuaSOC Backlog (Autonomous)

**Rule:** Each Autopilot run completes **exactly one** unchecked item as a PR.
After merge, mark the item as done and append to i/AUTOPILOT_LOG.md.

## 0) Bootstrap (architecture first)
- [x] Create docs/architecture/ARCHITECTURE.md (C4 context + container diagrams in Mermaid) and ADR 0001 (module boundaries & patterns).

## 1) Core domain modules
- [ ] Finish lerts-core: implement alert creation + severity filtering; make all tests green.
- [ ] Create ingest-core: canonical event type + strict parsers (JSON) + tests.
- [ ] Create detections-core: rule interface + simple correlation (e.g., burst by src/ip) + tests.
- [ ] Create cases-core: case lifecycle (open/triage/closed) + assignment + tests.

## 2) Integration surface
- [ ] Create pi-core: minimal REST API for ingest + query (no auth bypass; stub auth boundary + tests).
- [ ] Create cli: CLI for ingest/query using pi-core contract.

## 3) Hardening
- [ ] Add input schema validation utilities and safe logging redaction helpers used across modules.
