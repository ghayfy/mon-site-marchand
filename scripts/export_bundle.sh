#!/usr/bin/env bash
set -euo pipefail
: "${BASE:=http://localhost:4000}"
: "${OUTDIR:=dist/orders_bundle_$(date -u +%Y%m%d_%H%M%S)}"
: "${TOKEN:=}"
: "${STATUS:=}"
: "${DATE_FROM:=}"
: "${DATE_TO:=}"
mkdir -p "$OUTDIR" dist
curl_api() {
  local url="$1"; shift || true
  if [[ -n "${TOKEN:-}" ]]; then
    curl -fsS -H "Authorization: Bearer ${TOKEN}" "$url" "$@"
  else
    curl -fsS "$url" "$@"
  fi
}
build_qs() {
  local -a kv=()
  [[ -n "${STATUS:-}"    ]] && kv+=("status=${STATUS}")
  [[ -n "${DATE_FROM:-}" ]] && kv+=("date_from=${DATE_FROM}")
  [[ -n "${DATE_TO:-}"   ]] && kv+=("date_to=${DATE_TO}")
  local IFS='&'
  QS="${kv[*]:-}"
}
build_qs
echo "[1/4] Export CSV global…"
curl_api "${BASE}/api/admin/orders/export.csv${QS:+?${QS}}" -o "${OUTDIR}/orders_all.csv"
echo "[2/4] Liste des IDs…"
TMP_JSON="$(mktemp)"
curl_api "${BASE}/api/admin/orders${QS:+?${QS}}" -o "${TMP_JSON}"
IDS=()
while IFS= read -r line; do
  while [[ "$line" =~ \"id\"[[:space:]]*:[[:space:]]*([0-9]+) ]]; do
    IDS+=("${BASH_REMATCH[1]}")
    line="${line#*${BASH_REMATCH[1]}}"
  done
done < "${TMP_JSON}"
rm -f "${TMP_JSON}"
echo "[3/4] Exports par commande (CSV + PDF)…"
for oid in "${IDS[@]:-}"; do
  odir="${OUTDIR}/order_${oid}"
  mkdir -p "${odir}"
  curl_api "${BASE}/api/admin/orders/${oid}/export.csv" -o "${odir}/order_${oid}.csv"
  curl_api "${BASE}/api/admin/orders/${oid}/invoice.pdf" -o "${odir}/invoice_${oid}.pdf"
done
echo "[4/4] Archive ZIP…"
ZIP="dist/$(basename "${OUTDIR}").zip"
(
  cd "$(dirname "${OUTDIR}")"
  zip -qr "../$(basename "${ZIP}")" "$(basename "${OUTDIR}")"
)
echo "Bundle prêt: ${ZIP}"
