
set -euo pipefail

LOG=/tmp/cf.log

start_cf() {
  pkill -f "cloudflared tunnel" >/dev/null 2>&1 || true
  : > "$LOG"
  cloudflared tunnel --edge-ip-version 4 --no-autoupdate --url http://127.0.0.1:8080 >"$LOG" 2>&1 &
}

extract_url() {
  strings "$LOG" | grep -Eo 'https://[A-Za-z0-9.-]+trycloudflare\.com' | head -n1 | tr -d '\r' || true
}

resolves_ok() {
  local host="$1"
  if command -v host >/dev/null 2>&1; then
    host "$host" >/dev/null 2>&1
  elif command -v dig >/dev/null 2>&1; then
    dig +short "$host" | grep -qE '.'
  else
    curl -fsS -4 -o /dev/null "https://$host" >/dev/null 2>&1
  fi
}

ready_http() {
  local base="$1"
  for _ in $(seq 1 20); do
    code=$(curl -fsS -4 -o /dev/null -w '%{http_code}' "$base/api/health" || echo 000)
    [[ "$code" == "200" || "$code" == "401" ]] && return 0
    if grep -q 'status_code="429' "$LOG" 2>/dev/null; then
      sleep 20
    else
      sleep 1
    fi
  done
  return 1
}

unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY
start_cf

TUNNEL=""
for _ in $(seq 1 30); do
  TUNNEL="$(extract_url)"
  [[ -n "$TUNNEL" ]] && break
  if grep -q 'status_code="429' "$LOG" 2>/dev/null; then
    sleep 20
  else
    sleep 1
  fi
done

for attempt in $(seq 1 8); do
  if [[ -n "$TUNNEL" ]]; then
    HOST="${TUNNEL#https://}"; HOST="${HOST%%/*}"
    if resolves_ok "$HOST"; then
      break
    fi
  fi
  start_cf
  TUNNEL=""
  for _ in $(seq 1 30); do
    TUNNEL="$(extract_url)"
    [[ -n "$TUNNEL" ]] && break
    if grep -q 'status_code="429' "$LOG" 2>/dev/null; then
      sleep 20
    else
      sleep 1
    fi
  done
done

[[ -z "$TUNNEL" ]] && { echo "❌ Pas d’URL TryCloudflare"; sed -n '1,80p' "$LOG"; exit 1; }

ready_http "$TUNNEL" || echo "⚠️ /api/health pas encore prêt"

echo "# Health:"; curl -fsS -4 "$TUNNEL/api/health" || true; echo
echo "# Admin non authentifié (401 attendu) :"
curl -fsS -4 -o /dev/null -w '%{http_code}\n' "$TUNNEL/api/admin/orders?limit=1" || true
echo "# Admin authentifié :"
curl -fsS -4 -u admin:change-me "$TUNNEL/api/admin/orders?limit=1" | jq . || true
echo "$TUNNEL/#/admin/orders"
echo "$TUNNEL/#/admin/products"
