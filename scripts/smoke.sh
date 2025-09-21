#!/usr/bin/env bash
set +e
HOST=localhost PORT=8080
echo -n "GET /api/products => "; curl -fsS -o /dev/null -w "%{http_code}\n" "http://${HOST}:${PORT}/api/products?limit=5" || true
echo -n "GET /api/admin/products => "; curl -u admin:"${ADMIN_PASS:-Cd6dJVO6}" -fsS -o /dev/null -w "%{http_code}\n" "http://${HOST}:${PORT}/api/admin/products?limit=5" || true
