#!/usr/bin/env bash
set +e
DB_NAME=$(docker compose exec -T backend printenv DB_NAME 2>/dev/null | tr -d '\r'); DB_NAME=${DB_NAME:-monshop}
DB_USER=$(docker compose exec -T backend printenv DB_USER 2>/dev/null | tr -d '\r'); DB_USER=${DB_USER:-app}
DB_PASS=$(docker compose exec -T backend printenv DB_PASS 2>/dev/null | tr -d '\r'); DB_PASS=${DB_PASS:-app}
mkdir -p backups
docker compose exec -T db sh -lc "MYSQL_PWD='$DB_PASS' mysqldump --no-tablespaces --single-transaction --quick --skip-lock-tables -u'$DB_USER' '$DB_NAME' products" \
| gzip > "backups/products_$(date +%Y%m%d_%H%M%S).sql.gz"
echo "✅ backup: $(ls -1t backups/products_*.sql.gz | head -n1)"
