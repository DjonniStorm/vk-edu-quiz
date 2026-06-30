#!/bin/sh
# Регулярный деплой / точечная пересборка.
# Запускать из корня репо.
#
# Usage:
#   sh deploy/scripts/deploy.sh              — пересобрать и перезапустить всё
#   sh deploy/scripts/deploy.sh frontend     — только фронт
#   sh deploy/scripts/deploy.sh backend      — только бек
#   sh deploy/scripts/deploy.sh nginx-proxy  — только прокси
#
# Типичный workflow после git push фронта:
#   git pull && sh deploy/scripts/deploy.sh frontend

set -eu

cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod"
SERVICE="${1:-}"

if [ -n "$SERVICE" ]; then
    echo "==> Пересборка $SERVICE..."
    $COMPOSE build "$SERVICE"

    echo "==> Перезапуск $SERVICE..."
    $COMPOSE up -d "$SERVICE"

    echo "Готово: обновлён только '$SERVICE'."
else
    echo "==> Pull базовых образов..."
    $COMPOSE pull postgres certbot

    echo "==> Сборка всех образов..."
    $COMPOSE build

    echo "==> Запуск / обновление всех сервисов..."
    $COMPOSE up -d

    echo ""
    $COMPOSE ps
fi
