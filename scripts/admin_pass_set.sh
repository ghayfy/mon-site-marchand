#!/usr/bin/env bash
set -euo pipefail
USER="${1:-admin}"
PASS="${2:-}"
[ -n "$PASS" ] || { echo "Usage: $0 <user> <pass>"; exit 1; }

touch .env
grep -q '^ADMIN_USER=' .env && \
  sed -i '' "s/^ADMIN_USER=.*/ADMIN_USER=${USER}/" .env || \
  printf "ADMIN_USER=%s\n" "$USER" >> .env
grep -q '^ADMIN_PASS=' .env && \
  sed -i '' "s/^ADMIN_PASS=.*/ADMIN_PASS=${PASS}/" .env || \
  printf "ADMIN_PASS=%s\n" "$PASS" >> .env

printf "%s:%s\n" "$USER" "$(openssl passwd -apr1 "$PASS")" > frontend/htpasswd_admin
chmod 600 frontend/htpasswd_admin

docker compose up -d backend
for i in $(seq 1 30); do
  CID=$(docker compose ps -q backend) || true
  S=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID" 2>/dev/null || true)
  echo "backend health: $S"; [ "$S" = "healthy" ] && break; sleep 2
done
docker compose up -d frontend
docker compose exec -T frontend nginx -s reload || true

curl -fsS -u "${USER}:${PASS}" -o /dev/null -w "admin/orders => %{http_code}\n" \
  'http://localhost:8080/api/admin/orders?limit=1'
