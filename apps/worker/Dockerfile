FROM node:20-alpine AS build
WORKDIR /repo

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

COPY . .
RUN npm --workspaces run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
USER node

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json

COPY --from=build /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=build /repo/apps/worker/dist ./apps/worker/dist

COPY --from=build /repo/packages/core/package.json ./packages/core/package.json
COPY --from=build /repo/packages/core/dist ./packages/core/dist

COPY --from=build /repo/packages/reporting/package.json ./packages/reporting/package.json
COPY --from=build /repo/packages/reporting/dist ./packages/reporting/dist
COPY --from=build /repo/packages/reporting/report_definitions ./packages/reporting/report_definitions

COPY --from=build /repo/integrations/email/package.json ./integrations/email/package.json
COPY --from=build /repo/integrations/email/dist ./integrations/email/dist
COPY --from=build /repo/integrations/teams/package.json ./integrations/teams/package.json
COPY --from=build /repo/integrations/teams/dist ./integrations/teams/dist
COPY --from=build /repo/integrations/webhook/package.json ./integrations/webhook/package.json
COPY --from=build /repo/integrations/webhook/dist ./integrations/webhook/dist

CMD ["node", "apps/worker/dist/index.js"]
