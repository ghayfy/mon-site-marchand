#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
OID=$(curl -fsS -H "Authorization: Basic $AUTH" \
  'http://localhost:8080/api/admin/orders?limit=1' | jq -r '.items[0].id')
echo "OID=$OID"
for u in "/api/admin/orders/$OID/export.csv" "/api/admin/orders/$OID.csv"; do
  echo ">>> $u"
  code=$(curl -fsS -o /dev/null -w "%{http_code}" -H "Authorization: Basic $AUTH" "http://localhost:8080$u")
  test "$code" = "200" || { echo "FAIL $u => $code"; exit 1; }
done
echo "OK exports CSV"
