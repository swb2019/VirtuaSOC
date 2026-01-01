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
# Build only what this image needs (avoid pulling in apps/factory build deps like Prisma/Next).
RUN npm -w @virtuasoc/core run build \
  && npm -w @virtuasoc/reporting run build \
  && npm -w @virtuasoc/integration-email run build \
  && npm -w @virtuasoc/integration-teams run build \
  && npm -w @virtuasoc/integration-webhook run build \
  && npm -w @virtuasoc/worker run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
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
