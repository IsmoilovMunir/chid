.PHONY: db-up db-down prod-local prod-tls deploy-tls deploy-local down logs ps pull

COMPOSE_PROD=docker compose -f docker-compose.prod.yml --env-file .env
COMPOSE_BUILD=-f docker-compose.build.yml

# Local Postgres for IDE / mvn / npm run dev
db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

# Local full stack — builds images from ../backend|frontend|crm
prod-local:
	IMAGE_TAG=local $(COMPOSE_PROD) $(COMPOSE_BUILD) --profile local up -d --build

prod-tls:
	IMAGE_TAG=local $(COMPOSE_PROD) $(COMPOSE_BUILD) --profile tls up -d --build

# Server deploy — pull only, no build (used by CD and manual)
deploy-tls:
	./scripts/deploy.sh

deploy-local:
	DEPLOY_PROFILE=local ./scripts/deploy.sh

pull:
	@test -n "$(IMAGE_TAG)" || (echo "Set IMAGE_TAG=<sha|latest>"; exit 1)
	$(COMPOSE_PROD) --profile tls pull backend frontend crm

down:
	docker compose -f docker-compose.prod.yml --profile local --profile tls down

logs:
	docker compose -f docker-compose.prod.yml --profile local --profile tls logs -f --tail=200

ps:
	docker compose -f docker-compose.prod.yml --profile local --profile tls ps
	docker compose -f docker-compose.dev.yml ps
