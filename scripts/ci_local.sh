#!/usr/bin/env bash
set -euo pipefail
docker compose build backend
docker compose up -d backend
./scripts/wait_backend_healthy.sh
./scripts/smoke_ci.sh
