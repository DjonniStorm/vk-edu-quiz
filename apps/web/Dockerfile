# ── Build ──────────────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Workspace manifests first — docker layer cache
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN bun install

# Source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# VITE_* vars are baked into the JS bundle at build time
ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_WS_URL=ws://localhost:3000

WORKDIR /app/apps/web
RUN VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL bun run build

# ── Serve ──────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
