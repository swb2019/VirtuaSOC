# Microsoft Entra ID (Azure AD) OIDC setup — VirtuaSOC

VirtuaSOC supports **enterprise OIDC** for:
- **Tenant users** (main app sign-in at `/login`)
- **Platform operators** (Tenant Admin UI at `/admin`)

VirtuaSOC uses **Authorization Code + PKCE** (SPA-friendly). It will use `id_token` when present (works well with Entra).

## Recommended approach: Entra App Roles (not Groups)

Entra **App Roles** are the easiest way to get a stable `roles` claim without group overage/Graph dependencies.

VirtuaSOC can also map `groups`, but App Roles are strongly recommended.

## 1) Platform operator (admin UI) app registration

Create an Entra **App registration** (example name: `VirtuaSOC Platform Admin`).

### Authentication
- Add a **Single-page application (SPA)** platform
- Add redirect URI:
  - `https://app.virtuasoc.com/admin/oidc/callback`

### App roles
Create an App Role for platform admins, for example:
- Display name: `PlatformAdmin`
- Value: `PlatformAdmin`

Assign this role to your operator user(s).

### VirtuaSOC platform OIDC config (store in Infisical → `virtuasoc-secrets`)

Set these keys:
- `PLATFORM_OIDC_ISSUER`: `https://login.microsoftonline.com/<ENTRA_TENANT_ID>/v2.0`
- `PLATFORM_OIDC_CLIENT_ID`: `<APPLICATION_CLIENT_ID>`
- `PLATFORM_OIDC_SCOPES`: `openid profile email`
- `PLATFORM_OIDC_ROLE_CLAIM_PATH`: `roles`
- `PLATFORM_OIDC_ROLE_MAPPING`: `{ "PlatformAdmin": "admin" }`

Notes:
- `PLATFORM_ADMIN_KEY` remains **break-glass** (server-side fallback).
- After setting secrets, redeploy the Helm release so the API picks up the env vars.

## 2) Tenant user app registration (per tenant IdP)

For each tenant that uses Entra, create an App registration (example name: `VirtuaSOC - demo`).

### Authentication
- Add a **SPA** platform
- Add redirect URI:
  - `https://app.virtuasoc.com/oidc/callback`

### App roles
Create app roles like:
- `Analyst` → value `Analyst`
- `Lead` → value `Lead`
- `Admin` → value `Admin`

Assign roles to tenant users.

### Configure the tenant in VirtuaSOC (via Admin UI)

1) Go to:
- `https://app.virtuasoc.com/admin/login`
2) Sign in (platform SSO)
3) Create the tenant (or select an existing one)
4) Set tenant OIDC:
- issuer: `https://login.microsoftonline.com/<TENANT_ID>/v2.0`
- clientId: `<APPLICATION_CLIENT_ID>`
- scopes: `openid profile email`
- roleClaimPath: `roles`
- roleMapping (example):

```json
{
  "Analyst": "gsoc_analyst",
  "Lead": "gsoc_lead",
  "Admin": "admin"
}
```

## 3) Tenant user sign-in test

1) Go to `https://app.virtuasoc.com/login`
2) Set tenant slug (e.g. `demo`)
3) Click **Sign in with SSO**


