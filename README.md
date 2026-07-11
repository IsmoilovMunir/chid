# CHID — Ипотечный калькулятор

Веб-приложение для агентства недвижимости CHID: ипотечный калькулятор, CRM клиентов, лид-форма.

## Стек

- **Backend:** Java 21, Spring Boot 3.4, Spring Security, JWT, PostgreSQL
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS

## Структура

```
chid/
├── backend/     # Spring Boot API
├── frontend/    # React UI
└── docker-compose.yml
```

## Быстрый старт

### 1. PostgreSQL (опционально, для prod)

```bash
docker compose up -d
```

### 2. Backend

Требуется **Java 21** (Lombok не работает с Java 25).

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)   # macOS
./mvnw-local.sh spring-boot:run
```

API: http://localhost:8080

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

## API

| Метод | Endpoint | Доступ |
|-------|----------|--------|
| POST | `/api/calculator/calculate` | Публичный |
| POST | `/api/auth/login` | Публичный |
| POST | `/api/leads` | Публичный |
| GET/POST | `/api/clients` | Авторизация |
| GET/POST | `/api/calculations` | Авторизация |
| GET | `/api/calculations/public/{token}` | Публичный |

## Профили Spring

- `dev` (по умолчанию) — H2 in-memory, тестовые пользователи
- `prod` — PostgreSQL

```bash
SPRING_PROFILES_ACTIVE=prod ./mvnw-local.sh spring-boot:run
```

## Этапы MVP

- [x] Калькулятор (3 режима, аннуитет + дифференцированный)
- [x] График погашения
- [x] Публичная страница (SEO meta)
- [x] JWT авторизация
- [x] CRM: клиенты + расчёты
- [x] Лид-форма
- [ ] PDF-экспорт
- [ ] Деплой на домен CHID
