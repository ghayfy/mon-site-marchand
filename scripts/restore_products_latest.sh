#!/usr/bin/env bash
set +e
DB_NAME=$(docker compose exec -T backend printenv DB_NAME 2>/dev/null | tr -d '\r'); DB_NAME=${DB_NAME:-monshop}
DB_USER=$(docker compose exec -T backend printenv DB_USER 2>/dev/null | tr -d '\r'); DB_USER=${DB_USER:-app}
DB_PASS=$(docker compose exec -T backend printenv DB_PASS 2>/dev/null | tr -d '\r'); DB_PASS=${DB_PASS:-app}
LAST=$(ls -1t backups/products_*.sql.gz 2>/dev/null | head -n1)
[ -z "$LAST" ] && echo "❌ aucun dump dans ./backups" && exit 1
zcat "$LAST" | docker compose exec -T db sh -lc "MYSQL_PWD='$DB_PASS' mysql -u'$DB_USER' -D '$DB_NAME'"
echo "✅ restore: $LAST"
