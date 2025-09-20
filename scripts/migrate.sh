#!/usr/bin/env bash
set -euo pipefail

DB_NAME=${DB_NAME:-monshop}
DB_USER=${DB_USER:-app}
DB_PASS=${DB_PASS:-app}
MYSQL_ARGS=${MYSQL_ARGS:---default-character-set=utf8mb4}

run_mysql() {
  docker compose exec -T db sh -lc "MYSQL_PWD='$DB_PASS' mysql $MYSQL_ARGS -u'$DB_USER' -D '$DB_NAME' -N -B -e \"$1\""
}

docker compose exec -T db sh -lc "
  MYSQL_PWD='$DB_PASS' mysql $MYSQL_ARGS -u'$DB_USER' -D '$DB_NAME' -e \"
  CREATE TABLE IF NOT EXISTS __migrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;\"
"

for f in db/migrations/*.sql; do
  [ -e "$f" ] || continue
  base=$(basename "$f")
  applied=$(run_mysql "SELECT COUNT(*) FROM __migrations WHERE filename='$base';")
  if [ "$applied" = "0" ]; then
    echo "==> applying $base"
    docker compose exec -T db sh -lc "MYSQL_PWD='$DB_PASS' mysql $MYSQL_ARGS -u'$DB_USER' -D '$DB_NAME' < /dev/stdin" < "$f"
    run_mysql "INSERT INTO __migrations (filename) VALUES ('$base');"
  else
    echo "--  skipping $base (already applied)"
  fi
done

echo "Migrations OK."
