# Backend

API и WebSocket-сервер для VK Education Quiz: Bun, Elysia, Prisma, PostgreSQL.

## Локальная разработка

Из корня репозитория поднимите PostgreSQL:

```bash
bun run db:dev:up
```

Создайте `apps/backend/.env` из `apps/backend/.env.example`, если файла ещё нет.

Запуск из `apps/backend`:

```bash
bun run dev
```

API: http://localhost:3000/

## Документация API

Swagger UI: http://localhost:3000/docs

OpenAPI JSON: http://localhost:3000/docs/json

## Prisma

Команды выполняются из `apps/backend`:

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

Для продакшена (миграции без интерактива):

```bash
bun run db:migrate:deploy
```

## Тесты

```bash
bun test
```
