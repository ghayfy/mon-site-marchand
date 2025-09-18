#!/usr/bin/env bash
set -euo pipefail
BPORT="$(docker compose port backend 4000 | sed 's/.*://')"
echo "▶ PUT status -> SHIPPED"
curl -fsS -X PUT "http://127.0.0.1:${BPORT}/api/admin/orders/1/status" \
  -H 'Content-Type: application/json' \
  -d '{"status":"SHIPPED"}' | jq .
echo "▶ Exports headers"
curl -fsSI "http://127.0.0.1:${BPORT}/api/admin/orders/export.csv?status=SHIPPED" | head -n1
curl -fsSI "http://127.0.0.1:${BPORT}/api/admin/orders/export.pdf?status=SHIPPED" | head -n1
echo "✅ Admin smoke OK"
