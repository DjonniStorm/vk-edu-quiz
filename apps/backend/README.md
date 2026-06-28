# Backend

Bun + Elysia backend for the VK Education quiz app.

## Development

Start the local PostgreSQL container from the repository root:

```bash
bun run db:dev:up
```

Create `apps/backend/.env` from `apps/backend/.env.example` if it does not exist.

Start the backend:

```bash
bun run dev
```

Open http://localhost:3000/.

## API Docs

Swagger UI is available at:

```bash
http://localhost:3000/docs
```

OpenAPI JSON is available at:

```bash
http://localhost:3000/docs/json
```

## Prisma

Run Prisma commands from `apps/backend`:

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```
