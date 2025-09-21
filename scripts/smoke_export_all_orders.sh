#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export_all.csv" -o /tmp/orders_all.csv
head -n1 /tmp/orders_all.csv | grep -q '^id,total_ttc,currency,status,provider,created_at,updated_at,items_count$'
echo "OK export_all.csv"
