#!/bin/sh
# Первый выпуск Let's Encrypt для deploy/docker-compose.prod.yml.
# Без сертификата nginx-proxy не стартует: нет fullchain.pem.
# Запускать из корня репо: sh deploy/scripts/init-ssl.sh

set -eu

cd "$(dirname "$0")/../.."

if [ ! -f deploy/.env.prod ]; then
    echo "Создайте deploy/.env.prod из deploy/.env.prod.example"
    exit 1
fi

# Читаем переменные из .env.prod
set -a
# shellcheck disable=SC1091
. deploy/.env.prod
set +a

if [ -z "${DOMAIN:-}" ] || [ -z "${CERTBOT_EMAIL:-}" ]; then
    echo "Задайте DOMAIN и CERTBOT_EMAIL в deploy/.env.prod"
    exit 1
fi

COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod"
CERTBOT_WWW_VOLUME="quiz-prod_certbot_www"

# Проверка DNS
echo "==> Проверка DNS: ${DOMAIN}..."
if ! getent hosts "$DOMAIN" >/dev/null 2>&1; then
    echo "Предупреждение: не удалось разрешить ${DOMAIN}. Убедитесь, что DuckDNS указывает на IP ВМ."
fi

# Проверяем, есть ли уже сертификат
CERT_EXISTS=0
if docker run --rm -v quiz-prod_certbot_certs:/etc/letsencrypt:ro alpine \
    test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" 2>/dev/null; then
    CERT_EXISTS=1
    echo "==> Сертификат для ${DOMAIN} уже есть — пропускаем certonly."
fi

if [ "$CERT_EXISTS" -eq 0 ]; then
    echo "==> Создаём volume для webroot (если нет)..."
    docker volume create "$CERTBOT_WWW_VOLUME" >/dev/null 2>&1 || true

    echo "==> Запускаем временный nginx на :80 для ACME challenge..."
    docker rm -f quiz-acme-bootstrap 2>/dev/null || true
    docker run --rm -d \
        --name quiz-acme-bootstrap \
        -p 80:80 \
        -v "$(pwd)/deploy/nginx/bootstrap-acme.conf:/etc/nginx/conf.d/default.conf:ro" \
        -v "${CERTBOT_WWW_VOLUME}:/var/www/certbot" \
        nginx:1.27-alpine

    sleep 2

    echo "==> Запрашиваем сертификат Let's Encrypt для ${DOMAIN}..."
    if ! $COMPOSE run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        --email "$CERTBOT_EMAIL" \
        --agree-tos --no-eff-email \
        -d "$DOMAIN"; then
        docker stop quiz-acme-bootstrap 2>/dev/null || true
        echo "certbot завершился с ошибкой. Проверьте:"
        echo "  - DuckDNS указывает на IP этой ВМ"
        echo "  - порт 80 открыт (ufw allow 80)"
        echo "  - DOMAIN в .env.prod верный"
        exit 1
    fi

    docker stop quiz-acme-bootstrap 2>/dev/null || true
fi

echo "==> Поднимаем полный стек..."
$COMPOSE up -d --build

echo ""
echo "Готово: https://${DOMAIN}/"
echo "Certbot обновляет сертификат автоматически каждые 12 ч."
echo "После renew при необходимости: docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec nginx-proxy nginx -s reload"
