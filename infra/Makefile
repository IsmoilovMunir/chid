.PHONY: db-up db-down prod-local prod-tls down logs ps

# Local Postgres for IDE / mvn / npm run dev
db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

# Full stack without TLS (http://localhost:8088)
prod-local:
	docker compose -f docker-compose.prod.yml --env-file .env --profile local up -d --build

# Full stack with TLS (needs certs in ./certs or SSL_CERTS_DIR)
prod-tls:
	docker compose -f docker-compose.prod.yml --env-file .env --profile tls up -d --build

down:
	docker compose -f docker-compose.prod.yml --profile local --profile tls down

logs:
	docker compose -f docker-compose.prod.yml --profile local --profile tls logs -f --tail=200

ps:
	docker compose -f docker-compose.prod.yml --profile local --profile tls ps
	docker compose -f docker-compose.dev.yml ps
