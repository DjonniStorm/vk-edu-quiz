FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Workspace manifests first — docker layer cache
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN bun install --frozen-lockfile

# Source
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Generate Prisma client from schema (no DB needed at this step)
WORKDIR /app/apps/backend
RUN bunx prisma generate

EXPOSE 3000

# migrate deploy runs against the real DB at container startup
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
