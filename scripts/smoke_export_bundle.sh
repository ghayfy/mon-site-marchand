#!/usr/bin/env bash
set -euo pipefail
./scripts/export_bundle.sh
ZIP=$(ls -1t dist/orders_bundle_*.zip | head -n1)
[ -n "$ZIP" ] || { echo "ZIP manquant"; exit 1; }
echo "ZIP: $ZIP"
TMP="$(mktemp -d)"
unzip -q "$ZIP" -d "$TMP"
test -f "$TMP"/*/orders_all.csv
head -n1 "$TMP"/*/orders_all.csv | grep -q '^id,total_ttc,currency,status,provider,created_at,updated_at,items_count$'
ONE=$(find "$TMP" -type f -name 'order_*.csv' | head -n1 || true)
if [ -n "$ONE" ]; then
  head -n1 "$ONE" | grep -q '^order_id,total_ttc,currency,status,provider,created_at,updated_at$'
  PDF="${ONE%/*.csv}/invoice_${ONE##*/order_}"; PDF="${PDF%.csv}.pdf"
  head -c 7 "$PDF" | grep -q '^%PDF-1\.'
fi
echo "OK smoke bundle"
rm -rf "$TMP"
