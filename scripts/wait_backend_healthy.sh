#!/usr/bin/env bash
set -euo pipefail
for i in $(seq 1 30); do
  CID=$(docker compose ps -q backend) || true
  if [ -n "${CID:-}" ]; then
    S=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID" 2>/dev/null || true)
    echo "backend health: $S"
    [ "$S" = "healthy" ] && exit 0
  else
    echo "backend health: (no container)"
  fi
  sleep 2
done
echo "backend NOT healthy"
exit 1
