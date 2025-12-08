<!-- AMD-MANAGED:AUTOPILOT v1 -->
# AMD Autopilot Protocol (Backlog-driven)

## Absolute rules
- Never modify:
  - .github/workflows/**
  - .cursor/rules/**
- Work in **small commits**.
- Always add/adjust tests to prove behavior.

## What to do on every run (no user interaction)
1. Read i/PRODUCT.md and i/BACKLOG.md.
2. Select the **first** unchecked backlog item.
3. If the item introduces a new module:
   - Create pp/modules/<module>/{SPEC.md,CONTRACT.md,src,tests,docs}
   - Fill SPEC+CONTRACT before logic.
4. Implement until tests pass (pnpm test).
5. Update:
   - i/BACKLOG.md (check off the item)
   - i/AUTOPILOT_LOG.md (append: date, item, PR link, result)
6. Open a PR.

## Stop conditions
- If blocked by ambiguity or missing dependencies, write the blocker in i/AUTOPILOT_LOG.md and stop.
