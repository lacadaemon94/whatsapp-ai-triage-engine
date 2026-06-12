# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the WhatsApp AI Triage dashboard.
#   - deps:    install npm dependencies (cacheable layer)
#   - builder: produce the Next.js standalone output
#   - runner:  minimal runtime that ships only what the server needs
#
# The standalone output is a self-contained server with no node_modules to
# unpack at startup, so the runner image is ~150MB instead of ~600MB.

# ---- base ------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# ---- dependencies ----------------------------------------------------------
FROM base AS deps
# libc6-compat is a common Alpine gotcha for some Node native modules.
RUN apk add --no-cache libc6-compat
COPY apps/dashboard-nextjs/package.json apps/dashboard-nextjs/package-lock.json* ./apps/dashboard-nextjs/
WORKDIR /app/apps/dashboard-nextjs
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---- builder ---------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/apps/dashboard-nextjs/node_modules ./apps/dashboard-nextjs/node_modules
COPY apps/dashboard-nextjs ./apps/dashboard-nextjs

# Build-time env. DEMO_MODE is baked in for the public demo image; pass
# different values at `docker build` to produce a real-mode image.
ARG DEMO_MODE=true
ARG NEXT_PUBLIC_DEMO_MODE=true
ARG NEXT_PUBLIC_ENV_LABEL=Demo
ENV DEMO_MODE=${DEMO_MODE} \
    NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE} \
    NEXT_PUBLIC_ENV_LABEL=${NEXT_PUBLIC_ENV_LABEL} \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/dashboard-nextjs
RUN npx next build

# ---- runner ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

# Copy the Next.js standalone server + its required static assets.
# Because the build runs from apps/dashboard-nextjs/ the standalone tree is
# flat: server.js sits at the root of .next/standalone/.
#   .next/standalone/* -> /app/   (server.js + minimal node_modules)
#   .next/static       -> /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard-nextjs/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard-nextjs/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Defaults for demo. Overridable at `docker run` / compose for real mode.
ENV DEMO_MODE=true \
    NEXT_PUBLIC_DEMO_MODE=true \
    NEXT_PUBLIC_ENV_LABEL=Demo

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
