# Infra — Docker Compose, nginx, TLS, env, CI/CD

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

Образы в GHCR:

- `ghcr.io/ismoilovmunir/chid-backend`
- `ghcr.io/ismoilovmunir/chid-frontend`
- `ghcr.io/ismoilovmunir/chid-crm`

## Локальная БД (dev)

```bash
cd infra
make db-up
```

Postgres: `localhost:5433`, user/pass `chid` / `chid`.

## Production / smoke (сборка на машине)

```bash
cd infra
cp .env.example .env
# заполнить POSTGRES_PASSWORD, JWT_SECRET, ADMIN_*

make prod-local   # без TLS, порт 8088
make prod-tls     # с TLS
```

## Деплой образов из CI (без build на сервере)

```bash
# на сервере, после docker login ghcr.io
cd /opt/chid/infra   # или ваш DEPLOY_PATH
IMAGE_TAG=abc123def456 make deploy-tls
```

## GitHub Actions

| Workflow | Когда | Что делает |
|----------|--------|------------|
| `ci.yml` | PR / push в `main` | compile + unit tests, build frontend/crm |
| `cd.yml` | push в `main` | build & push образов в GHCR; deploy по SSH если включён |

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Назначение |
|--------|------------|
| `DEPLOY_HOST` | IP/hostname сервера |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | приватный SSH-ключ |
| `DEPLOY_PATH` | путь к `infra/` на сервере, напр. `/opt/chid/infra` |
| `DEPLOY_SSH_PORT` | опционально, по умолчанию 22 |
| `GHCR_USER` | GitHub username для `docker login` |
| `GHCR_TOKEN` | PAT с `read:packages` (и `write:packages` если нужно) |

### Variables

| Variable | Назначение |
|----------|------------|
| `AUTO_DEPLOY` | `true` — деплой на каждый push в `main` |
| `VITE_PUBLIC_SITE_URL` и др. | опционально для CRM image build |

Пока сервер не готов: образы всё равно пушатся в GHCR. Деплой вручную: **Actions → CD → Run workflow**.

На сервере один раз:

1. Клонировать репо (или только `infra/`)
2. `cp .env.example .env` и заполнить
3. Положить TLS в `certs/`
4. `docker login ghcr.io`
5. Включить `AUTO_DEPLOY=true` или деплоить через workflow_dispatch

## Домены (TLS)

| Host | Сервис |
|------|--------|
| `chid.ru` | frontend + `/api` → backend |
| `crm.chid.ru` | CRM + `/api` → backend |
