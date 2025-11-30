# ADR-0002: alerts-core Module Design

Date: 2025-11-30
Status: Accepted

## Context

The `alerts-core` module is the foundational data model for VirtuaSOC. It needs
to define a `SecurityAlert` type and basic operations (creation, filtering by
severity) that other modules will depend on. Key design questions:

1. How to represent severity levels?
2. How to generate alert IDs?
3. What guarantees should the module provide?

## Decision

### Severity Model

Use a TypeScript string union type:

```typescript
type Severity = "low" | "medium" | "high" | "critical";
```

**Rationale**: String unions serialize cleanly to JSON, provide type safety at
compile time, and are more readable in logs and debug output than numeric enums.

### ID Generation

Generate IDs using `Date.now().toString(36)` combined with a random suffix:

```typescript
`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
```

**Rationale**: This produces compact, roughly-sortable IDs sufficient for
correlation and tracking. It is **not** cryptographically secure and should not
be used for security-sensitive purposes. If UUIDs or secure IDs are needed
later, a separate utility module can provide them.

### Pure Functions

All functions in `alerts-core` are pure and side-effect free:

- No IO (file, network, database)
- No logging (handled by callers or dedicated modules)
- No mutation of input arguments

**Rationale**: Purity makes the module easy to test, reason about, and compose.
Side effects are pushed to the edges of the system.

### Input Validation

The module does **not** validate input beyond TypeScript's compile-time checks.
For example, it does not verify that `source` or `message` are non-empty strings.

**Rationale**: Validation logic varies by context (API boundaries, user input,
inter-module calls). Keeping `alerts-core` validation-free allows callers to
apply their own policies. A future `alerts-validation` module could provide
reusable validators if needed.

## Consequences

- Other modules can depend on `alerts-core` for the canonical `SecurityAlert`
  type without pulling in IO or validation dependencies.
- ID generation is simple but not globally unique across distributed systems;
  this is acceptable for the current single-node scope.
- Callers are responsible for validating inputs before calling `createAlert`.
- The severity ordering (`low < medium < high < critical`) is an internal
  implementation detail; callers should use `filterAlertsBySeverity` rather
  than comparing severity strings directly.




