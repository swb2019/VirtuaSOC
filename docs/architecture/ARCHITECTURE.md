# VirtuaSOC Architecture

This document provides a high-level overview of the VirtuaSOC system architecture.

## Module Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      VirtuaSOC                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Future Modules                       │  │
│  │  (ingest, enrichment, correlation, case-mgmt, ...)    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   alerts-core                         │  │
│  │         SecurityAlert model & filtering               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## alerts-core

The `alerts-core` module is the foundational data model layer for VirtuaSOC. It
defines the `SecurityAlert` type and `Severity` levels used throughout the
platform, along with basic operations for creating alerts and filtering them by
severity. The module is intentionally pure and IO-free: it performs no network
calls, file operations, or logging. This design keeps the core data model
simple, testable, and composable, allowing higher-level modules (ingestion,
enrichment, correlation, case management) to build on top of it without
inheriting unnecessary dependencies. See
[ADR-0002](../adr/ADR-0002-alerts-core-design.md) for detailed design rationale.








