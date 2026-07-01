# Frontend

Клиентская часть VK Education Quiz: React, Vite, Mantine, MobX, i18n (ru/en).

## Локальная разработка

Из корня репозитория (нужен запущенный backend):

```bash
bun run dev:web
```

Приложение: http://localhost:5173/

Переменные `VITE_API_URL` и `VITE_WS_URL` — опционально (по умолчанию `http://localhost:3000` и ws на том же хосте). См. `src/shared/config/env.ts`.

## Сборка

Из `apps/web`:

```bash
bun run build
```

Статика попадает в `dist/`. Локальный просмотр сборки:

```bash
bun run preview
```

## Линтер

```bash
bun run lint
```
