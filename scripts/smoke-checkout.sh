#!/usr/bin/env bash
set -euo pipefail
BPORT="$(docker compose port backend 4000 | sed 's/.*://')"
curl -fsS -X POST "http://127.0.0.1:${BPORT}/api/checkout" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":1,"name":"Demo product","price":9.99,"qty":2}]}' | jq .
echo "✅ Checkout OK"
