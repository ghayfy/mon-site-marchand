HOST ?= localhost
PORT ?= 8080
ADMIN_USER ?= admin
ADMIN_PASS ?= Cd6dJVO6

.PHONY: up smoke logs db-dump db-restore-last seed reset

up:
	docker compose up -d db backend frontend

smoke:
	HOST=$(HOST) PORT=$(PORT) ADMIN_USER=$(ADMIN_USER) ADMIN_PASS=$(ADMIN_PASS) ./scripts/smoke.sh

logs:
	docker compose logs --no-color --tail=200 backend

db-dump:
	mkdir -p backups
	docker compose exec -T db sh -lc 'mysqldump -uapp -papp monshop' > "backups/monshop_$$(date +%F_%H%M%S).sql"
	@ls -1t backups/monshop_*.sql | head -n1 | xargs -I{} echo "Dump => {}"

db-restore-last:
	@F=$$(ls -1t backups/monshop_*.sql 2>/dev/null | head -n1); \
	[ -n "$$F" ] || (echo "Aucun dump"; exit 1); \
	echo "Restore $$F"; \
	docker compose exec -T db sh -lc "mysql -uapp -papp monshop" < "$$F"

seed:
	docker compose exec -T db sh -lc "mysql -uapp -papp -D monshop < /dev/stdin" < scripts/seed.sql

reset:
	docker compose exec -T db sh -lc 'mysql -uapp -papp -e "DROP DATABASE IF EXISTS monshop; CREATE DATABASE monshop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"'
	$(MAKE) seed
