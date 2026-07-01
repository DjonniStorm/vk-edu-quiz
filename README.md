# VK Education Quiz

![VK Education Quiz](assets/preview.jpg)

## Что это

Веб-приложение для **живых интерактивных опросов**: организатор создаёт опрос, участники подключаются по коду или QR-коду, отвечают в реальном времени, видят лидерборд. Есть личный кабинет с историей прохождений.

Учебный проект (монорепо: React + Bun + Elysia + PostgreSQL).

## Зачем

- провести квиз в аудитории или онлайн без сторонних сервисов;
- автоматически считать баллы и показывать таблицу лидеров;
- хранить историю участия для залогиненных пользователей.

## Быстрый старт (dev)

```bash
bun install
bun run db:dev:up
bun run dev:backend   # :3000
bun run dev:web       # :5173
```

Подробнее: [backend](apps/backend/README.md), [frontend](apps/web/README.md).

## Деплой

В папке [`deploy/`](deploy/) — продакшен на Docker Compose:

| Файл                      | Назначение                                                  |
| ------------------------- | ----------------------------------------------------------- |
| `docker-compose.prod.yml` | postgres, backend, frontend (nginx), reverse-proxy, certbot |
| `.env.prod.example`       | шаблон переменных (домен, БД, JWT)                          |
| `scripts/init-ssl.sh`     | первый выпуск Let's Encrypt                                 |
| `scripts/deploy.sh`       | сборка и перезапуск (всё или отдельный сервис)              |
| `nginx/templates/`        | конфиг прокси с SSL и проксированием API/WS                 |

Кратко:

```bash
cp deploy/.env.prod.example deploy/.env.prod
# заполнить DOMAIN, CERTBOT_EMAIL, пароли

sh deploy/scripts/init-ssl.sh          # один раз, до первого старта
sh deploy/scripts/deploy.sh            # полный деплой
sh deploy/scripts/deploy.sh frontend   # только фронт после git pull
```
