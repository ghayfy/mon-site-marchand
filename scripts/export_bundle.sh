#!/usr/bin/env bash
set -euo pipefail
OUTDIR="dist/orders_$(date -u +%Y%m%d_%H%M%S)"
mkdir -p "$OUTDIR"
AUTH=$(printf 'admin:Cd6dJVO6' | base64)
QS=""
for kv in "$@"; do
  [ -z "$QS" ] && QS="?$kv" || QS="$QS&$kv"
done
echo "[1/4] Téléchargement export_all.csv$QS…"
curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders/export_all.csv$QS" \
  -o "$OUTDIR/orders_all.csv"
echo "[2/4] Récupération des IDs de commandes…"
IDS=$(curl -fsS -H "Authorization: Basic $AUTH" \
  "http://localhost:8080/api/admin/orders?limit=1000$([ -n "$QS" ] && echo "&${QS#?}")" \
  | jq -r '.items[].id' )
if [ -z "$IDS" ]; then
  echo "Aucune commande trouvée avec ces filtres."
  exit 0
fi
echo "[3/4] Téléchargements par commande…"
i=0
for id in $IDS; do
  d="$OUTDIR/orders/$id"
  mkdir -p "$d"
  curl -fsS -H "Authorization: Basic $AUTH" \
    "http://localhost:8080/api/admin/orders/$id/export.csv" -o "$d/order_$id.csv"
  curl -fsS -H "Authorization: Basic $AUTH" \
    "http://localhost:8080/api/admin/orders/$id/invoice.pdf" -o "$d/invoice_$id.pdf"
  i=$((i+1))
done
echo "OK ($i commandes)"
echo "[4/4] Archive ZIP…"
ZIP="dist/orders_bundle_$(date -u +%Y%m%d_%H%M%S).zip"
(cd "$OUTDIR"/.. && zip -qr "../$(basename "$ZIP")" "$(basename "$OUTDIR")")
echo "Bundle prêt: $ZIP"
