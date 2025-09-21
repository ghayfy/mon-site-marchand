#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-localhost}"
PORT="${PORT:-8080}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-Cd6dJVO6}"

red() { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
step() { printf "\n\033[36m▶ %s\033[0m\n" "$*"; }

fail() { red "✗ $*"; exit 1; }
ok()   { green "✓ $*"; }

base="http://${HOST}:${PORT}"

step "Public products 200 & JSON ok"
code=$(curl -fsS -o /dev/null -w '%{http_code}' "${base}/api/products?limit=3") || true
[[ "$code" == "200" ]] || fail "GET /api/products => $code"
jq -e '.[0].id' >/dev/null 2>&1 <<<"$(curl -fsS "${base}/api/products?limit=3")" || fail "JSON array attendu"
ok "/api/products OK"

step "Admin sans auth => 401"
code=$(curl -fsS -o /dev/null -w '%{http_code}' "${base}/api/admin/products?limit=1") || true
[[ "$code" == "401" ]] || fail "401 attendu, reçu $code"
ok "401 sans auth"

step "Admin avec auth => 200"
code=$(curl -u "${ADMIN_USER}:${ADMIN_PASS}" -fsS -o /dev/null -w '%{http_code}' "${base}/api/admin/products?limit=1") || true
[[ "$code" == "200" ]] || fail "admin/products 200 attendu, reçu $code"
ok "admin/products 200"

step "Exports CSV/PDF => 200"
for p in csv pdf; do
  code=$(curl -u "${ADMIN_USER}:${ADMIN_PASS}" -fsS -o /dev/null -w '%{http_code}' "${base}/api/admin/orders/export.${p}") || true
  [[ "$code" == "200" ]] || fail "export.${p} 200 attendu, reçu $code"
done
ok "exports OK"

step "UTF-8 vérif (CAP-BLK => Coton brossé)"
desc=$(curl -fsS "${base}/api/products?limit=50" | jq -r '.[] | select(.sku=="CAP-BLK") | .description')
[[ "$desc" == "Coton brossé" ]] || fail "Description non UTF-8 propre: '$desc'"
ok "UTF-8 OK"

step "Pagination admin: limit=2 => 2 items"
count=$(curl -u "${ADMIN_USER}:${ADMIN_PASS}" -fsS "${base}/api/admin/products?limit=2" | jq -r '.items | length')
[[ "$count" == "2" ]] || fail "Pagination: attendu 2, reçu $count"
ok "Pagination OK"

step "Proxy transmet Authorization (vérif côté backend en intra-container)"
docker compose exec -T backend sh -lc '
AUTH=$(printf "'"${ADMIN_USER}:${ADMIN_PASS}"'" | base64);
wget -qO- --header "Authorization: Basic $AUTH" http://127.0.0.1:4000/api/admin/products?limit=1 >/dev/null' \
|| fail "Backend intra-container KO"
ok "Backend intra-container OK"

green "\n✔ SMOKE TESTS: TOUT OK"
echo
echo "▶ UTF-8 sanity"
OUT=$(curl -fsS "http://$HOST:$PORT/api/products?limit=50" \
  | jq -r '.[] | select(.sku=="MUG-LOGO" or .sku=="CAP-BLK") | .description' \
  | paste -sd'|' -)
case "$OUT" in
  *"Ã"*|"null"|"") echo "✗ UTF-8 KO"; exit 1;;
  *) echo "✓ UTF-8 OK";;
esac

echo
step "Auth client JWT"
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"motdepasse"}' \
  "http://${HOST}:${PORT}/api/auth/login") || true
[[ "$code" == "200" ]] || fail "login 200 attendu, reçu $code"
TOKEN=$(curl -fsS -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"motdepasse"}' \
  "http://${HOST}:${PORT}/api/auth/login" | jq -r .token)
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "http://${HOST}:${PORT}/api/me") || true
[[ "$code" == "200" ]] || fail "/api/me 200 attendu, reçu $code"
ok "JWT login + /me OK"
