
set -euo pipefail
BPORT="$(docker compose port backend 4000 | sed 's/.*://')"
FPORT="$(docker compose port frontend 80   | sed 's/.*://')"
echo "BACK=${BPORT}  FRONT=${FPORT}"
curl -fsS "http://127.0.0.1:${BPORT}/api/health" | jq .
curl -fsS "http://127.0.0.1:${BPORT}/api/admin/orders?page=1&limit=3" | jq .
curl -fsS "http://127.0.0.1:${BPORT}/api/admin/products?limit=3" | jq .
curl -fsS "http://127.0.0.1:${FPORT}/api/admin/products?limit=3" | jq .
curl -fsSI "http://127.0.0.1:${BPORT}/api/admin/orders/export.csv?status=SHIPPED" | head -n1
curl -fsSI "http://127.0.0.1:${BPORT}/api/admin/orders/export.pdf?status=SHIPPED" | head -n1
