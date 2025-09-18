.PHONY: up down logs smoke
up:    ; docker compose up -d --build
down:  ; docker compose down -v
logs:  ; docker compose logs -f --tail=100
smoke: ; ./scripts/smoke-v2.sh
