
HOST ?= localhost
PORT ?= 8080
ADMIN_PASS ?= Cd6dJVO6
ADMIN_USER ?= admin

.PHONY: up smoke logs

up:
	docker compose up -d db backend frontend

smoke:
	HOST=$(HOST) PORT=$(PORT) ADMIN_USER=$(ADMIN_USER) ADMIN_PASS=$(ADMIN_PASS) ./scripts/smoke.sh

logs:
	docker compose logs --no-color --tail=200 backend

.PHONY: seed reset
seed:
	docker compose exec -T db sh -lc "mysql -uapp -papp -D monshop < /dev/stdin" < scripts/seed.sql

reset:
	docker compose exec -T db sh -lc 'mysql -uapp -papp -e "DROP DATABASE IF EXISTS monshop; CREATE DATABASE monshop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"'
	$(MAKE) seed
