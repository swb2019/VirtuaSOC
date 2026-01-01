# Intelligence Product Factory (Next.js App)

This app (`apps/factory/`) is the new **Intelligence Product Factory** SaaS UI + backend (Next.js App Router).

It is developed as part of **Autonomous Modular Delivery (AMD)**. See:
- `docs/amd/README.md` (module roadmap + flags)

## Feature flag
The app is deployed but gated behind:
- `FEATURE_FACTORY_APP=true`

When disabled, the home page shows a “disabled” screen.

## Local development (recommended)

### 1) Start infra
From repo root:

```bash
docker compose up -d
```

This starts:
- Postgres (`localhost:5432`)
- Redis (`localhost:6379`)

### 2) Run control-plane migrations
VirtuaSOC’s Fastify API currently owns SQL migrations for the control-plane tables (tenants + NextAuth + RBAC).

Run once (from repo root):

```bash
npm -w @virtuasoc/api run db:migrate:control
```

### 3) Configure env
Create a `.env` in repo root or set env vars for the factory process. Minimum required for Entra sign-in:
- `FEATURE_FACTORY_APP=true`
- `CONTROL_DATABASE_URL=postgres://postgres:postgres@localhost:5432/virtuasoc_control`
- `TENANT_DSN_ENCRYPTION_KEY=...` (32 bytes base64/hex)
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=...`
- `ENTRA_CLIENT_ID=...`
- `ENTRA_CLIENT_SECRET=...`
- `ENTRA_TENANT_ID=...`

See `config/env.example` for the full set.

### 4) Run the factory app

```bash
npm -w @virtuasoc/factory run dev
```

Open `http://localhost:3000`.

## Prisma notes
This app uses **two Prisma schemas**:
- `prisma/control/schema.prisma` (control-plane)
- `prisma/tenant/schema.prisma` (tenant-plane)

Generated clients are output under `apps/factory/src/generated/*` via:

```bash
npm -w @virtuasoc/factory run prisma:generate
```

In containers, Prisma clients are generated during build and copied into the runtime image.

