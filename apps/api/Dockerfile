FROM node:20-alpine AS build
WORKDIR /repo

# Install deps (workspace-aware)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/reporting/package.json packages/reporting/package.json
COPY integrations/email/package.json integrations/email/package.json
COPY integrations/teams/package.json integrations/teams/package.json
COPY integrations/webhook/package.json integrations/webhook/package.json
RUN npm ci

# Build
COPY . .
RUN npm --workspaces run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
USER node

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json

COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/migrations-control ./apps/api/migrations-control
COPY --from=build /repo/apps/api/migrations-tenant ./apps/api/migrations-tenant

COPY --from=build /repo/packages/core/package.json ./packages/core/package.json
COPY --from=build /repo/packages/core/dist ./packages/core/dist

COPY --from=build /repo/packages/reporting/package.json ./packages/reporting/package.json
COPY --from=build /repo/packages/reporting/dist ./packages/reporting/dist
COPY --from=build /repo/packages/reporting/report_definitions ./packages/reporting/report_definitions

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
