# Infra — единственное, что живёт на сервере

На **сервере нет кода** backend/frontend/crm — только эта папка.
Приложения приходят как Docker-образы из GHCR. Управление — через `docker compose` и `.env`.

```
GitHub (код)                    Сервер (только infra/)
─────────────                   ──────────────────────
push main  ──CI──► build        /opt/chid/infra/
           ──CD──► push GHCR         ├── docker-compose.prod.yml
           ──CD──► rsync infra/       ├── nginx/
           ──CD──► deploy.sh          ├── certs/
                                      ├── scripts/
                                      └── .env  ← секреты (не в git)
```

## Что где хранится

| Место | Что |
|-------|-----|
| **GitHub repo** | код + `infra/` + workflows |
| **GitHub Secrets** | SSH-ключ, хост, GHCR token для CD |
| **Сервер `.env`** | пароль БД, JWT, admin, IMAGE_TAG |
| **GHCR** | готовые образы backend / frontend / crm |

## Первый запуск сервера

```bash
# на VPS (один раз)
curl -fsSL https://get.docker.com | sh
sudo bash infra/scripts/bootstrap-server.sh

# как deploy user
sudo mkdir -p /opt/chid/infra
sudo chown deploy:deploy /opt/chid
cd /opt/chid/infra
cp .env.example .env
nano .env   # POSTGRES_PASSWORD, JWT_SECRET, ADMIN_*
# положить TLS в certs/fullchain.pem + privkey.pem
```

## GitHub Secrets (Settings → Secrets → Actions)

| Secret | Пример | Зачем |
|--------|--------|-------|
| `DEPLOY_HOST` | `1.2.3.4` | IP сервера |
| `DEPLOY_USER` | `deploy` | SSH user |
| `DEPLOY_SSH_KEY` | `-----BEGIN...` | приватный ключ |
| `DEPLOY_PATH` | `/opt/chid/infra` | путь к infra на сервере |
| `DEPLOY_SSH_PORT` | `22` | опционально |
| `GHCR_USER` | `ismoilovmunir` | для docker pull |
| `GHCR_TOKEN` | PAT | `read:packages` |

## GitHub Variables

| Variable | Значение | Зачем |
|----------|----------|-------|
| `AUTO_DEPLOY` | `true` | деплой на каждый push в main |

## Как работает CD

1. Push в `main` → GitHub Actions собирает образы → пушит в GHCR
2. CD копирует **только `infra/`** на сервер (`.env` не трогает)
3. На сервере: `scripts/deploy.sh` → `docker login` → `pull` → `up -d`

Ручной деплой: **Actions → CD → Run workflow**

## На сервере вручную

```bash
cd /opt/chid/infra
export IMAGE_TAG=abc123def456   # или latest
export GHCR_USER=ismoilovmunir
export GHCR_TOKEN=ghp_...
./scripts/deploy.sh
```

## Локальная разработка (у разработчика)

```bash
cd infra
make db-up          # только Postgres
make prod-local     # полный стек с локальной сборкой
```

Образы GHCR:

- `ghcr.io/ismoilovmunir/chid-backend:<tag>`
- `ghcr.io/ismoilovmunir/chid-frontend:<tag>`
- `ghcr.io/ismoilovmunir/chid-crm:<tag>`

## Домены

| Host | Сервис |
|------|--------|
| `chid.ru` | frontend + `/api` |
| `crm.chid.ru` | CRM + `/api` |
