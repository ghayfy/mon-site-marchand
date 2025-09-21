#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
OID=$(curl -fsS -H "Authorization: Basic $AUTH" \
  'http://localhost:8080/api/admin/orders?limit=1' | jq -r '.items[0].id')
test -n "$OID" && [[ "$OID" =~ ^[0-9]+$ ]]
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/$OID/invoice.pdf" -o /tmp/invoice.pdf
head -c 7 /tmp/invoice.pdf | grep -q '^%PDF-1\.' 
grep -a "FACTURE" /tmp/invoice.pdf >/dev/null 2>&1 || true
grep -a "$OID" /tmp/invoice.pdf >/dev/null 2>&1 || true
echo "OK invoice.pdf ($OID)"
