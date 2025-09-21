#!/usr/bin/env bash
set -euo pipefail
./scripts/verify_mount_order.sh
./scripts/smoke_exports_all.sh
./scripts/smoke_export_all_orders.sh
./scripts/smoke_export_all_filters.sh
./scripts/smoke_auth_admin.sh
echo "ALL SMOKES OK"
