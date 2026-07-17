# CHID — Ипотечный калькулятор

Веб-приложение для агентства недвижимости CHID: ипотечный калькулятор, CRM клиентов, лид-форма.

## Стек

- **Backend:** Java 21, Spring Boot 3.4, Spring Security, JWT, PostgreSQL
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS

## Структура

```
chid/
├── backend/     # Spring Boot API (+ Dockerfile)
├── frontend/    # Публичный сайт (+ Dockerfile)
├── crm/         # CRM (+ Dockerfile)
├── infra/       # Docker Compose, nginx, TLS, env
└── docker-compose.yml   # → infra (локальный Postgres)
```

## Быстрый старт

### 1. PostgreSQL

```bash
docker compose up -d
# или: cd infra && make db-up
```

БД: `chid_mortgage`, пользователь/пароль: `chid` / `chid`, порт: **5433** (чтобы не конфликтовать с другим PostgreSQL на 5432).  
Схема применяется автоматически через **Liquibase** при старте backend.

### 2. Backend

Требуется **Java 21** (Lombok не работает с Java 25).

**IntelliJ IDEA:** откройте папку `backend` (или корень `chid` и дождитесь импорта Maven).
- Project SDK: **Java 21**
- Maven → Reload Project
- Settings → Build → Compiler → Annotation Processors → **Enable**

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)   # macOS
./mvnw-local.sh spring-boot:run
```

Проверка сборки:
```bash
cd backend && ./mvnw-local.sh compile
```

API: http://localhost:8080  
Health: http://localhost:8080/actuator/health

**Тестовые пользователи (dev):**
- `admin@chid.ru` / `admin123`
- `realtor@chid.ru` / `realtor123`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173

### 4. CRM (отдельное приложение)

```bash
cd crm
npm install
npm run dev
```

CRM UI: http://localhost:5174  
Домен prod: **crm.chid.ru**

**CRM — расчёты:**
- `/calculations/new` — калькулятор + сохранение в CRM
- `/calculations/:id` — карточка расчёта + публичная ссылка
- Публичная ссылка для клиента: `https://chid.ru/calc/{token}`

Переменная для CRM (опционально):
```bash
# crm/.env
VITE_PUBLIC_SITE_URL=https://chid.ru
```

## Деплой (production)

Всё управление Docker / nginx / CI — из [`infra/`](infra/README.md).

```bash
cd infra
cp .env.example .env
make prod-local   # локальный smoke
# make prod-tls   # прод с TLS
```

CI/CD: `.github/workflows/ci.yml` + `cd.yml` (образы → GHCR, деплой по SSH).  
Секреты и шаги: [infra/README.md](infra/README.md).

## API

| Метод | Endpoint | Доступ |
|-------|----------|--------|
| POST | `/api/calculator/calculate` | Публичный |
| POST | `/api/auth/login` | Публичный |
| POST | `/api/leads` | Публичный |
| GET/POST | `/api/clients` | Авторизация |
| GET | `/api/calculations/{id}` | Авторизация |
| GET/POST | `/api/calculations` | Авторизация |
| GET | `/api/calculations/public/{token}` | Публичный |
| GET | `/actuator/health` | Публичный |

## Профили Spring

- `dev` (по умолчанию) — PostgreSQL + Liquibase, тестовые пользователи
- `prod` — PostgreSQL + Liquibase, обязательные `JWT_SECRET` / `DATABASE_*`, bootstrap админа через env

```bash
SPRING_PROFILES_ACTIVE=prod \
  DATABASE_URL=jdbc:postgresql://localhost:5433/chid_mortgage \
  DATABASE_USER=chid \
  DATABASE_PASSWORD=strong-password \
  JWT_SECRET=your-long-random-secret-at-least-32-chars \
  ./mvnw-local.sh spring-boot:run
```

Миграции: `backend/src/main/resources/db/changelog/`.  
Новые изменения схемы — отдельный файл в `changes/` и `include` в `db.changelog-master.yaml`.

## Этапы MVP

- [x] Калькулятор (3 режима, аннуитет + дифференцированный)
- [x] График погашения
- [x] Публичная страница (SEO meta)
- [x] JWT авторизация
- [x] CRM: клиенты + расчёты
- [x] Лид-форма
- [x] CRM UI (логин, клиенты, расчёты) — `crm/`
- [x] PDF-экспорт (CRM: карточка расчёта)
- [ ] Деплой на домен CHID
