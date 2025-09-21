#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
echo -n "Orders list => "
curl -fsS -H "Authorization: Basic $AUTH" \
  'http://localhost:8080/api/admin/orders?limit=1' >/dev/null && echo OK
OID=$(curl -fsS -H "Authorization: Basic $AUTH" \
  'http://localhost:8080/api/admin/orders?limit=1' | jq -r '.items[0].id')
echo "OID=$OID"
curl -fsS -H "Authorization: Basic $AUTH" "http://localhost:8080/api/admin/orders/$OID" | jq '{id,status}'
curl -fsS -X PUT -H "Authorization: Basic $AUTH" -H 'Content-Type: application/json' \
  -d '{"status":"PAID"}' "http://localhost:8080/api/admin/orders/$OID/status" | jq .
curl -fsS -H "Authorization: Basic $AUTH" 'http://localhost:8080/api/admin/orders/export.csv' | head -n1
