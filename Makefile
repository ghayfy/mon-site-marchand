HOST ?= localhost
PORT ?= 8080
ADMIN_USER ?= admin
ADMIN_PASS ?= Cd6dJVO6

.PHONY: up smoke logs db-dump db-dump-structure db-restore-last seed reset show-tables

up:
	docker compose up -d db backend frontend

smoke:
	HOST=$(HOST) PORT=$(PORT) ADMIN_USER=$(ADMIN_USER) ADMIN_PASS=$(ADMIN_PASS) ./scripts/smoke.sh

logs:
	docker compose logs --no-color --tail=200 backend

db-dump:
	mkdir -p backups
	docker compose exec -T db sh -lc 'MYSQL_PWD=app mysqldump -uapp --no-tablespaces --databases monshop' > "backups/monshop_$$(date +%F_%H%M%S).sql"
	@ls -1t backups/monshop_*.sql | head -n1 | xargs -I{} echo "Dump => {}"

db-dump-structure:
	mkdir -p scripts
	docker compose exec -T db sh -lc 'MYSQL_PWD=app mysqldump -uapp --no-tablespaces --no-data monshop' > scripts/schema.sql
	@echo "Schema => scripts/schema.sql"

db-restore-last:
	@F=$$(ls -1t backups/monshop_*.sql 2>/dev/null | head -n1); \
	[ -n "$$F" ] || (echo "Aucun dump"; exit 1); \
	echo "Restore $$F"; \
	docker compose exec -T db sh -lc 'MYSQL_PWD=app mysql -uapp' < "$$F"

seed:
	docker compose exec -T db sh -lc "MYSQL_PWD=app mysql -uapp -D monshop < /dev/stdin" < scripts/seed.sql

reset:
	docker compose exec -T db sh -lc 'MYSQL_PWD=app mysql -uapp -e "DROP DATABASE IF EXISTS monshop; CREATE DATABASE monshop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"'
	$(MAKE) db-dump-structure >/dev/null
	docker compose exec -T db sh -lc "MYSQL_PWD=app mysql -uapp -D monshop < /dev/stdin" < scripts/schema.sql
	$(MAKE) seed

show-tables:
	docker compose exec -T db sh -lc 'MYSQL_PWD=app mysql -uapp -e "SHOW TABLES FROM monshop;"'
