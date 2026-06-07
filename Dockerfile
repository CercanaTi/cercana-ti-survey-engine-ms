# Multi-stage build for optimized production image
FROM public.ecr.aws/docker/library/node:24-alpine AS base

# Upgrade all packages to patch OS vulnerabilities and install dumb-init
RUN apk upgrade --no-cache && apk add --no-cache dumb-init

WORKDIR /usr/src/app

COPY package*.json ./

# ─── Development stage ────────────────────────────────────────────────────────
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─── Build stage ──────────────────────────────────────────────────────────────
FROM base AS build
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --production

# ─── Production stage ─────────────────────────────────────────────────────────
FROM base AS production

COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node healthcheck.js ./healthcheck.js

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
