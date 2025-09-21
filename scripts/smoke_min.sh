#!/usr/bin/env bash
set +e
curl -fsS -o /dev/null -w "GET /api/products => %{http_code}\n" \
  'http://localhost:8080/api/products?limit=2'
curl -i -sS -X POST 'http://localhost:8080/api/checkout' \
  -H 'Content-Type: application/json' \
  --data '{"items":[{"slug":"tee-shirt-blanc","qty":1}],"customer":{"email":"client@example.com"}}' \
  | sed -n '1,40p'
