FROM node:20-alpine AS build
WORKDIR /repo

# Install deps (workspace-aware)
COPY package.json package-lock.json ./
COPY apps/factory/package.json apps/factory/package.json
RUN npm ci

# Build
COPY . .
RUN npm -w @virtuasoc/factory run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules

COPY --from=build /repo/apps/factory/package.json ./apps/factory/package.json
COPY --from=build /repo/apps/factory/.next ./apps/factory/.next
COPY --from=build /repo/apps/factory/public ./apps/factory/public
# Prisma client output is generated into the repo under apps/factory/src/generated/* (linux binaries in build stage).
COPY --from=build /repo/apps/factory/src/generated ./apps/factory/src/generated

EXPOSE 3000
WORKDIR /repo/apps/factory

CMD ["node", "../../node_modules/next/dist/bin/next", "start", "--port", "3000"]


