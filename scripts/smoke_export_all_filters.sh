#!/usr/bin/env bash
set -euo pipefail
AUTH=$(printf 'admin:Cd6dJVO6' | base64)

curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export_all.csv" -o /tmp/orders_all.csv
head -n1 /tmp/orders_all.csv | grep -q '^id,total_ttc,currency,status,provider,created_at,updated_at,items_count$'
echo "OK export_all (no filters)"

curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export_all.csv?status=PAID" -o /tmp/orders_paid.csv
head -n1 /tmp/orders_paid.csv | grep -q '^id,total_ttc,currency,status,provider,created_at,updated_at,items_count$'
if [ "$(wc -l < /tmp/orders_paid.csv)" -gt 1 ]; then
  tail -n +2 /tmp/orders_paid.csv | grep -v ',PAID,' && { exit 1; } || true
fi
echo "OK export_all (status=PAID)"

FROM=$(date -u +"%Y-%m-01T00:00:00Z")
TO=$(date -u +"%Y-%m-%dT23:59:59Z")
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export_all.csv?date_from=$FROM&date_to=$TO" -o /tmp/orders_range.csv
head -n1 /tmp/orders_range.csv | grep -q '^id,total_ttc,currency,status,provider,created_at,updated_at,items_count$'
echo "OK export_all (date range)"
echo "ALL GOOD: filters"
