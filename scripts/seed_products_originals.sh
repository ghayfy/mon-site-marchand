#!/usr/bin/env bash
set +e
DB_NAME=$(docker compose exec -T backend printenv DB_NAME 2>/dev/null | tr -d '\r'); DB_NAME=${DB_NAME:-monshop}
DB_USER=$(docker compose exec -T backend printenv DB_USER 2>/dev/null | tr -d '\r'); DB_USER=${DB_USER:-app}
DB_PASS=$(docker compose exec -T backend printenv DB_PASS 2>/dev/null | tr -d '\r'); DB_PASS=${DB_PASS:-app}
TMP=/tmp/restore_originals.sql
cat > "$TMP" <<'SQL'
INSERT INTO products
(title, slug, description, sku, price_h_t, tva, stock, active, created_at, updated_at)
VALUES
('Tee-shirt blanc','tee-shirt-blanc','Tee-shirt blanc', 'TSH-WHT-001', 9.99, 20.00, 100, 1, NOW(), NOW()),
('Mug logo','mug-logo','Mug logo', 'MUG-LOG-001', 7.50, 20.00, 200, 1, NOW(), NOW()),
('Sac coton','sac-coton','Sac coton', 'BAG-COT-001', 3.90, 20.00, 500, 1, NOW(), NOW()),
('Casquette noire','casquette-noire','Casquette noire', 'CAP-BLK-001', 12.50, 20.00, 150, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  title      = VALUES(title),
  description= VALUES(description),
  sku        = VALUES(sku),
  price_h_t  = VALUES(price_h_t),
  tva        = VALUES(tva),
  stock      = VALUES(stock),
  active     = VALUES(active),
  updated_at = NOW();
SQL
docker compose cp "$TMP" db:/tmp/restore_originals.sql
docker compose exec -T db sh -lc "MYSQL_PWD='$DB_PASS' mysql -u'$DB_USER' -D '$DB_NAME' < /tmp/restore_originals.sql"
echo "✅ seed originals OK"
