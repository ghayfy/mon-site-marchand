#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
OID=$(curl -fsS -H "Authorization: Basic $AUTH" \
  'http://localhost:8080/api/admin/orders?limit=1' | jq -r '.items[0].id')
test -n "$OID" && [[ "$OID" =~ ^[0-9]+$ ]] || { exit 1; }
echo "OID=$OID"
ok() { echo "OK $1"; }
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/$OID/export.csv" -o /tmp/order_path.csv
head -n1 /tmp/order_path.csv | grep -q '^order_id,total_ttc,currency,status,provider,created_at,updated_at$' \
  && ok "CSV path"
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export.csv?id=$OID" -o /tmp/order_query.csv
head -n1 /tmp/order_query.csv | grep -q '^order_id,total_ttc,currency,status,provider,created_at,updated_at$' \
  && ok "CSV query"
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/$OID/export.pdf" -o /tmp/order_path.pdf
head -c 7 /tmp/order_path.pdf | grep -q '^%PDF-1\.' && ok "PDF path"
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export.pdf?id=$OID" -o /tmp/order_query.pdf
head -c 7 /tmp/order_query.pdf | grep -q '^%PDF-1\.' && ok "PDF query"
echo "ALL GOOD: exports CSV/PDF (path + query)"
