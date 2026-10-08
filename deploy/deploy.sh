#!/usr/bin/env bash
# Deploys (or updates) RaiseUp on the VM. Called by GitHub Actions over SSH; can also be run by hand:
#   cd ~/raiseup && IMAGE_TAG=latest ./deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/raiseup}"
cd "$APP_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }
red() { printf '\033[0;31m%s\033[0m\n' "$*"; }

# 1. Settings -> .env (owner only). A value that is not provided keeps its previous value.
touch .env && chmod 600 .env
set_env() {
  local key="$1" value="${2:-}"
  [ -z "$value" ] && return 0
  { grep -v "^${key}=" .env || true; printf '%s=%s\n' "$key" "$value"; } > .env.tmp
  mv .env.tmp .env && chmod 600 .env
}
env_get() { grep "^$1=" .env | tail -n1 | cut -d= -f2- || true; }

set_env IMAGE_TAG "${IMAGE_TAG:-latest}"
set_env POSTGRES_USER "${POSTGRES_USER:-}"
set_env POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
set_env POSTGRES_DB "${POSTGRES_DB:-}"
set_env JWT_SECRET "${JWT_SECRET:-}"
set_env CORS_ORIGIN "${CORS_ORIGIN:-}"
set_env CLIENT_BIND "${CLIENT_BIND:-}"
# The previous setup had no JWT secret: create a strong one once and keep it.
if [ -z "$(env_get JWT_SECRET)" ]; then
  yellow "No JWT_SECRET given: generating one (stored in ~/raiseup/.env)"
  set_env JWT_SECRET "$(head -c 48 /dev/urandom | base64 | tr -d '\n/+=')"
fi
for k in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  [ -n "$(env_get $k)" ] || { red "$k is missing (GitHub secret)"; exit 1; }
done

# 2. Registry login
if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-anasserekysy}" --password-stdin >/dev/null
fi
docker network inspect web >/dev/null 2>&1 || { yellow "Creating Docker network web"; docker network create web >/dev/null; }

# 3. The old pipeline wrote docker-compose.yml and .env.* here; keep them aside.
for f in docker-compose.yml .env.db .env.server; do [ -f "$f" ] && mv -f "$f" "$f.old"; done

# 4. Pull and (re)start. The API applies pending database migrations on start.
green "Pulling images (tag: $(env_get IMAGE_TAG))"
$COMPOSE pull
green "Starting the stack"
$COMPOSE up -d --remove-orphans

# 5. Wait until the site answers through the client's Nginx (client + API + database).
yellow "Waiting for http://127.0.0.1:3000/api/health ..."
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    green "RaiseUp is up (healthy after ~$((i * 5))s)"
    if docker inspect "${PROXY_CONTAINER:-reverse-proxy}" >/dev/null 2>&1; then
      docker exec "${PROXY_CONTAINER:-reverse-proxy}" nginx -t >/dev/null 2>&1 \
        && docker exec "${PROXY_CONTAINER:-reverse-proxy}" nginx -s reload >/dev/null 2>&1 \
        && green "Reverse proxy reloaded" || yellow "Could not reload the reverse proxy (check its config)"
    fi
    $COMPOSE ps
    docker image prune -f >/dev/null || true
    exit 0
  fi
  sleep 5
done

red "The API did not become healthy in time. Last API logs:"
$COMPOSE logs --tail 80 api || true
$COMPOSE ps
exit 1
