FROM node:24-alpine AS base
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /repo

# ---- deps ----
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter=@aag/api...

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=@aag/api

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp

COPY --from=build --chown=nodeusr:nodegrp /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodeusr:nodegrp /repo/apps/api/migrations ./apps/api/migrations
COPY --from=build --chown=nodeusr:nodegrp /repo/node_modules ./node_modules
COPY --from=build --chown=nodeusr:nodegrp /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=nodeusr:nodegrp /repo/package.json ./package.json
COPY --from=build --chown=nodeusr:nodegrp /repo/turbo.json ./turbo.json
COPY --from=build --chown=nodeusr:nodegrp /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build --chown=nodeusr:nodegrp /repo/apps/api/package.json ./apps/api/package.json

RUN chmod +x apps/api/node_modules/.bin/* node_modules/.bin/* 2>/dev/null || true

USER nodeusr
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
