# Infra — Docker Compose, nginx, TLS, env

Всё управление контейнерами и reverse proxy — из этой папки.
Dockerfile’ы приложений остаются рядом с кодом (`backend/`, `frontend/`, `crm/`).

```
infra/
├── docker-compose.dev.yml    # только Postgres (локальная разработка)
├── docker-compose.prod.yml   # backend + frontend + crm + nginx
├── nginx/                    # конфиги reverse proxy
├── certs/                    # TLS (не коммитить .pem)
├── .env.example
└── Makefile
```

## Локальная БД (dev)

```bash
cd infra
make db-up
# или: docker compose -f docker-compose.dev.yml up -d
```

Postgres: `localhost:5433`, user/pass `chid` / `chid`.

С корня репозитория по-прежнему работает:

```bash
docker compose up -d
```

## Production / smoke

```bash
cd infra
cp .env.example .env
# заполнить POSTGRES_PASSWORD, JWT_SECRET, ADMIN_*

# без TLS (порт 8088)
make prod-local

# с TLS (нужны certs/fullchain.pem + privkey.pem)
make prod-tls
```

Остановка: `make down` · логи: `make logs`

## Домены (TLS)

| Host | Сервис |
|------|--------|
| `chid.ru` | frontend + `/api` → backend |
| `crm.chid.ru` | CRM + `/api` → backend |
