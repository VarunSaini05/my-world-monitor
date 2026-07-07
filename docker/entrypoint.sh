#!/bin/sh
set -e

# Docker secrets → env var bridge
# Reads /run/secrets/KEYNAME files and exports as env vars.
# Secrets take priority over env vars set via docker-compose environment block.
if [ -d /run/secrets ]; then
  for secret_file in /run/secrets/*; do
    [ -f "$secret_file" ] || continue
    key=$(basename "$secret_file")
    value=$(cat "$secret_file" | tr -d '\n')
    export "$key"="$value"
  done
fi

export LOCAL_API_PORT="${LOCAL_API_PORT:-46123}"
export LOCAL_REDIS_PORT="${LOCAL_REDIS_PORT:-46279}"

# Single-container self-host default: when no external Upstash/Redis is
# configured, start the bundled local REST cache and point the existing API +
# seed scripts at it. Operators can still provide real Upstash credentials and
# this path will stand down automatically.
if [ -z "${UPSTASH_REDIS_REST_URL:-}" ] || [ -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]; then
  export UPSTASH_REDIS_REST_URL="http://127.0.0.1:${LOCAL_REDIS_PORT}"
  export UPSTASH_REDIS_REST_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-local-self-hosted}"
  export SELF_HOSTED_LOCAL_REDIS="true"
fi

if [ -z "${LOCAL_API_TOKEN:-}" ]; then
  LOCAL_API_TOKEN="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))")"
  export LOCAL_API_TOKEN
fi

envsubst '$LOCAL_API_PORT $LOCAL_API_TOKEN' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/worldmonitor.conf
