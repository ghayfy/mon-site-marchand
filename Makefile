.PHONY: smoke up logs

up:
	docker compose up -d db backend frontend

smoke:
	HOST?=localhost PORT?=8080 ADMIN_PASS?=Cd6dJVO6 ./scripts/smoke.sh

logs:
	docker compose logs --no-color --tail=200 backend
