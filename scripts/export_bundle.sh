#!/usr/bin/env bash
set -euo pipefail
: "${BASE:=http://localhost:4000}"
: "${BASE_AUTO:=1}"
: "${OUTDIR:=dist/orders_bundle_$(date -u +%Y%m%d_%H%M%S)}"
: "${TOKEN:=}"
: "${STATUS:=}"
: "${DATE_FROM:=}"
: "${DATE_TO:=}"
: "${AUTO_UP:=1}"
: "${WAIT_SECS:=120}"
mkdir -p "$OUTDIR" dist
dc() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    return 127
  fi
}
if [[ "${AUTO_UP}" = "1" ]]; then
  if dc version >/dev/null 2>&1; then
    dc up -d db backend >/dev/null 2>&1 || true
  fi
fi
if dc version >/dev/null 2>&1; then
  cid="$(dc ps -q backend || true)"
  if [[ -n "${cid}" ]]; then
    echo "[0/4] Attente HEALTH=healthy (backend)…"
    t=0
    while :; do
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${cid}" 2>/dev/null || echo none)"
      [[ "${status}" = "healthy" ]] && break
      [[ "${status}" = "starting" || "${status}" = "none" ]] || true
      t=$((t+1))
      if (( t >= WAIT_SECS )); then
        echo "Timeout: backend non healthy (${status}) après ${WAIT_SECS}s"
        exit 1
      fi
      sleep 1
    done
    if [[ "${BASE_AUTO}" = "1" ]]; then
      hp="$(dc port backend 4000 2>/dev/null || true)"
      if [[ -n "${hp}" ]]; then
        host="${hp%:*}"
        port="${hp##*:}"
        [[ "${host}" = "0.0.0.0" ]] && host="localhost"
        BASE="http://${host}:${port}"
      fi
    fi
  fi
fi
proto="$(printf %s "$BASE" | sed -E 's#^(https?)://.*#\1#')"
host="$(printf %s "$BASE" | sed -E 's#^https?://([^:/]+).*#\1#')"
port="$(printf %s "$BASE" | sed -nE 's#^https?://[^:/]+:([0-9]+).*#\1#p')"
if [[ -z "${port:-}" ]]; then
  if [[ "$proto" = "https" ]]; then port=443; else port=80; fi
fi
echo "[0/4] Attente TCP ${host}:${port} (${BASE})…"
t=0
while ! (exec 3<>"/dev/tcp/${host}/${port}") 2>/dev/null; do
  t=$((t+1))
  if (( t >= WAIT_SECS )); then
    echo "Backend indisponible sur ${host}:${port} après ${WAIT_SECS}s"
    exit 1
  fi
  sleep 1
done
exec 3>&- 3<&-
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
