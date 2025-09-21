#!/usr/bin/env bash
set -euo pipefail
: "${ADMIN_PASS:?usage: ADMIN_PASS=... $0}"
echo "== stack up =="
docker compose up -d db backend frontend
echo "== migrate =="
DB_NAME=monshop DB_USER=app DB_PASS=app ./scripts/migrate.sh
echo "== set admin pass & smoke =="
ADMIN_PASS="$ADMIN_PASS" ./scripts/admin-pass.sh
echo "== db sanity =="
docker compose exec -T db sh -lc '
MYSQL_PWD=app mysql -uapp -e "
  USE monshop;
  SHOW TABLES;
  SELECT COUNT(*) n_prod FROM products;
  SELECT COUNT(*) n_cat FROM categories;
  SELECT COUNT(*) n_orders FROM information_schema.tables
    WHERE table_schema=\"monshop\" AND table_name=\"orders\";
"'
echo "== nginx sanity =="
docker compose exec -T frontend sh -lc 'nginx -t && echo OK'
echo "== API public check =="
curl -fsS -o /dev/null -w "GET /api/products => %{http_code}\n" http://localhost:8080/api/products?limit=3
echo "== OK =="
