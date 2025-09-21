#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <ADMIN_USER> <ADMIN_PASS>" >&2
  exit 2
fi
USER_NEW="$1"
PASS_NEW="$2"

grep -q '^ADMIN_USER=' .env && sed -i '' "s/^ADMIN_USER=.*/ADMIN_USER=${USER_NEW}/" .env || echo "ADMIN_USER=${USER_NEW}" >> .env
grep -q '^ADMIN_PASS=' .env && sed -i '' "s/^ADMIN_PASS=.*/ADMIN_PASS=${PASS_NEW}/" .env || echo "ADMIN_PASS=${PASS_NEW}" >> .env

printf "%s:%s\n" "$USER_NEW" "$(openssl passwd -apr1 "$PASS_NEW")" > frontend/htpasswd_admin
chmod 600 frontend/htpasswd_admin

docker compose up -d backend
for i in $(seq 1 30); do
  CID=$(docker compose ps -q backend) || true
  S=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID" 2>/dev/null || true)
  echo "backend health: $S"
  [ "$S" = "healthy" ] && break
  sleep 2
done
docker compose up -d frontend
docker compose exec -T frontend nginx -s reload || true

set -a; . ./.env; set +a
code1=$(curl -fsS -o /dev/null -w "%{http_code}" "http://localhost:8080/api/products?limit=1" || true)
code2=$(curl -fsS -u "${ADMIN_USER}:${ADMIN_PASS}" -o /dev/null -w "%{http_code}" "http://localhost:8080/api/admin/orders?limit=1" || true)

echo "GET /api/products => $code1"
echo "GET /api/admin/orders => $code2"

[ "$code1" = "200" ] && [ "$code2" = "200" ] || { echo "❌ Vérifs KO"; exit 1; }
echo "✅ Rotation admin OK"
