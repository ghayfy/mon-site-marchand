#!/usr/bin/env bash
set -euo pipefail
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ '$1' manquant"; exit 1; }; }
need curl
need docker
JQ=jq
command -v jq >/dev/null 2>&1 || JQ="python3 -c 'import sys,json;print(json.dumps(json.load(sys.stdin),indent=2,ensure_ascii=False))'"
BPORT="$(docker compose port backend 4000 | sed 's/.*://')"
FPORT="$(docker compose port frontend 80   | sed 's/.*://')"
echo "🔌 BACK=${BPORT}  FRONT=${FPORT}"
wait_http() {
  local url="$1"
  local tries="${2:-30}"
  local i=0
  until curl -fsS "$url" -o /dev/null; do
    i=$((i+1))
    if [ "$i" -ge "$tries" ]; then
      echo "❌ Timeout sur $url"
      exit 1
    fi
    sleep 1
  done
}
echo "⏳ Attente services…"
wait_http "http://127.0.0.1:${BPORT}/api/health"
wait_http "http://127.0.0.1:${FPORT}/"
echo "✅ Health:"
curl -fsS "http://127.0.0.1:${BPORT}/api/health" | eval "$JQ"
echo "📦 Produits (admin backend):"
curl -fsS "http://127.0.0.1:${BPORT}/api/admin/products?limit=3" | eval "$JQ"
echo "🧾 Commandes (admin backend):"
curl -fsS "http://127.0.0.1:${BPORT}/api/admin/orders?page=1&limit=3" | eval "$JQ"
echo "🧭 Produits via frontend (reverse proxy):"
curl -fsS "http://127.0.0.1:${FPORT}/api/admin/products?limit=3" | eval "$JQ"
workdir="${TMPDIR:-/tmp}"
csv="${workdir%/}/orders.csv"
pdf="${workdir%/}/orders.pdf"
get_and_check() {
  local url="$1" out="$2" expect_ct="$3"
  curl -fsS "$url" -o "$out"
  ct="$(file -b --mime-type "$out")"
  size="$(wc -c < "$out" | tr -d ' ')"
  echo "→ $out  | type=$ct  size=${size}B"
  if [[ "$ct" != "$expect_ct" || "$size" -le 0 ]]; then
    echo "❌ Mauvais type ou fichier vide pour $out"; exit 1
  fi
}
echo "📤 Exports:"
get_and_check "http://127.0.0.1:${BPORT}/api/admin/orders/export.csv?status=SHIPPED" "$csv" "text/plain"
get_and_check "http://127.0.0.1:${BPORT}/api/admin/orders/export.pdf?status=SHIPPED" "$pdf" "application/pdf"
echo "🎉 Smoke-test OK"
