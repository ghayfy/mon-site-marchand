#!/usr/bin/env bash
set -euo pipefail
code=$(curl -fsS -o /dev/null -w "%{http_code}" 'http://localhost:8080/api/admin/orders/10/export.csv' || true)
test "$code" = "401" && echo "OK 401 sans auth" || { echo "FAIL: attendu 401, reçu $code"; exit 1; }
