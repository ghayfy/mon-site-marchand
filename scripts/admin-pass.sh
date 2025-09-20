#!/usr/bin/env bash
set -euo pipefail
: "${ADMIN_USER:=admin}"
: "${ADMIN_PASS:?usage: ADMIN_PASS=... $0}"

docker run --rm httpd:alpine htpasswd -Bbn "$ADMIN_USER" "$ADMIN_PASS" > htpasswd_admin
tr -d '\r' < htpasswd_admin > htpasswd_admin.lf && mv htpasswd_admin.lf htpasswd_admin

docker compose up -d frontend
docker compose exec -T frontend sh -lc 'nginx -t && nginx -s reload'

HOST=localhost PORT=8080 ADMIN_USER="$ADMIN_USER" ADMIN_PASS="$ADMIN_PASS" ./scripts/smoke.sh
