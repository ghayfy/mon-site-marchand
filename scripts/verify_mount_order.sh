#!/usr/bin/env bash
set -euo pipefail
app=backend/app.js
exp_all=$(nl -ba "$app" | awk '/app\.use\("\/api", adminOrdersExportAll\)/{print $1; exit}')
exp_one=$(nl -ba "$app" | awk '/app\.use\("\/api", adminOrdersExport\)/{print $1; exit}')
db=$(nl -ba "$app" | awk '/app\.use\("\/api", adminOrdersDb\)/{print $1; exit}')
test -n "${db:-}" || { echo "adminOrdersDb non trouvé"; exit 1; }
test -n "${exp_all:-}" || { echo "adminOrdersExportAll non trouvé"; exit 1; }
test -n "${exp_one:-}" || { echo "adminOrdersExport non trouvé"; exit 1; }
if (( exp_all < db && exp_one < db )); then
  echo "OK: export_all & export montés avant adminOrdersDb"
else
  echo "BAD: ordre de montage incorrect"; exit 1
fi
