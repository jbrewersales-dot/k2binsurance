# syntax=docker/dockerfile:1
# Multi-stage build producing a small standalone Next.js image that runs
# `prisma migrate deploy` then the server on start.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- migrator ----
# The Prisma CLI has transitive deps (@prisma/config -> effect, c12, ...) that
# aren't part of the app's runtime trace, so give `migrate deploy` its own
# complete install, pinned to the exact version from the lockfile.
FROM base AS migrator
WORKDIR /migrate
COPY package-lock.json ./
RUN npm install --no-save --no-audit --no-fund \
      prisma@"$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
    && rm package-lock.json

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone server output + static assets + public files.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema/migrations + the generated client for the app runtime, plus a
# self-contained CLI tree (from the migrator stage) for `migrate deploy` on boot.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=migrator /migrate/node_modules ./migrate/node_modules

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
