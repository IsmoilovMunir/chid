.PHONY: db-up db-down prod-local prod-tls deploy-tls deploy-local down logs ps pull

COMPOSE_PROD=docker compose -f docker-compose.prod.yml --env-file .env

# Local Postgres for IDE / mvn / npm run dev
db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

# Full stack without TLS — build images locally
prod-local:
	$(COMPOSE_PROD) --profile local up -d --build

# Full stack with TLS — build images locally
prod-tls:
	$(COMPOSE_PROD) --profile tls up -d --build

# Pull GHCR images (IMAGE_TAG required) and restart — used by CD / manual deploy
pull:
	@test -n "$(IMAGE_TAG)" || (echo "Set IMAGE_TAG=<sha|latest>"; exit 1)
	$(COMPOSE_PROD) --profile tls pull backend frontend crm

deploy-tls:
	@test -n "$(IMAGE_TAG)" || (echo "Set IMAGE_TAG=<sha|latest>"; exit 1)
	$(COMPOSE_PROD) --profile tls pull backend frontend crm
	$(COMPOSE_PROD) --profile tls up -d

deploy-local:
	@test -n "$(IMAGE_TAG)" || (echo "Set IMAGE_TAG=<sha|latest>"; exit 1)
	$(COMPOSE_PROD) --profile local pull backend frontend crm
	$(COMPOSE_PROD) --profile local up -d

down:
	docker compose -f docker-compose.prod.yml --profile local --profile tls down

logs:
	docker compose -f docker-compose.prod.yml --profile local --profile tls logs -f --tail=200

ps:
	docker compose -f docker-compose.prod.yml --profile local --profile tls ps
	docker compose -f docker-compose.dev.yml ps
