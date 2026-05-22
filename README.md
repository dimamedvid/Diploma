# Ukr-Book

Ukr-Book — це інформаційна вебсистема для створення, перегляду, модерації та оцінювання авторських літературних творів.

Проєкт складається з frontend-частини на React, backend-частини на Node.js / Express та бази даних PostgreSQL.

---

## Основний функціонал

- реєстрація та авторизація користувачів;
- збереження користувачів у PostgreSQL;
- хешування паролів через `bcryptjs`;
- JWT-авторизація;
- ролі користувачів: `user`, `moderator`, `admin`;
- створення літературних творів;
- редагування власних творів;
- модерація творів;
- підтвердження або відхилення творів;
- збереження причини відхилення;
- перегляд опублікованих творів;
- пошук, фільтрація та сортування творів;
- коментарі та оцінки;
- лайки коментарів;
- обрані твори;
- прогрес читання;
- улюблені жанри;
- рекомендоване сортування за улюбленими жанрами;
- особистий кабінет користувача;
- адміністративна статистика;
- Swagger / OpenAPI-документація API;
- JSDoc-документація frontend і backend.

---

## Технологічний стек

### Frontend

- React;
- React Router;
- Redux Toolkit;
- CSS;
- Fetch API;
- Cucumber / Playwright для E2E-сценаріїв;
- JSDoc.

### Backend

- Node.js;
- Express;
- PostgreSQL;
- `pg`;
- `bcryptjs`;
- `jsonwebtoken`;
- `dotenv`;
- `cors`;
- Swagger / OpenAPI;
- JSDoc;
- ESLint.

### Інфраструктура

- Git / GitHub;
- GitHub Actions;
- Nginx;
- systemd;
- PostgreSQL;
- Node.js LTS;
- npm.

---

## Структура проєкту

```text
.
├── .github/
│   └── workflows/
│       ├── deploy-docs.yml
│       └── e2e-cucumber.yml
│
├── docs/
│   ├── architecture.md
│   ├── backup.md
│   ├── deployment.md
│   ├── generate_docs.md
│   ├── live_documentation.md
│   ├── performance.md
│   └── update.md
│
├── my-app/
│   ├── features/
│   │   ├── authentication.feature
│   │   ├── search.feature
│   │   ├── steps/
│   │   └── support/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/
│   ├── docs/
│   │   ├── api/
│   │   └── swagger.js
│   ├── middlewares/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── index.js
│   └── package.json
│
├── scripts/
├── LICENSE
└── README.md
```

---

## Основні backend-модулі

### Routes

- `auth.routes.js` — реєстрація, логін, поточний користувач;
- `work.routes.js` — твори, сторінки творів, модерація;
- `comment.routes.js` — коментарі, оцінки, лайки;
- `userActivity.routes.js` — обране, прогрес читання, улюблені жанри;
- `adminStats.routes.js` — адміністративна статистика.

### Utils

- `db.js` — підключення до PostgreSQL, SQL-запити, транзакції;
- `userDb.js` — робота з таблицею `users`;
- `workDb.js` — робота з таблицями `works` і `work_pages`;
- `commentDb.js` — робота з `comments` і `comment_likes`;
- `userActivityDb.js` — робота з `favorite_works`, `reading_progress`, `favorite_genres`;
- `adminStatsDb.js` — SQL-запити для сторінки статистики;
- `AppError.js` — контрольовані API-помилки;
- `logger.js` — логування.

---

## База даних

У проєкті використовується PostgreSQL.

Основні таблиці:

- `users`;
- `works`;
- `work_pages`;
- `comments`;
- `comment_likes`;
- `favorite_works`;
- `reading_progress`;
- `favorite_genres`.

Для створення актуальної структури БД використовується файл:

```text
server/scripts/reset-auth-and-user-relations.sql
```

---

## Запуск локально

### 1. Клонування репозиторію

```bash
git clone https://github.com/dimamedvid/Diploma.git
cd Diploma
```

---

### 2. Встановлення backend-залежностей

```bash
cd server
npm install
```

---

### 3. Налаштування backend `.env`

Створи файл:

```text
server/.env
```

Приклад:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ukr_book_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=replace_this_with_long_random_secret
JWT_EXPIRES_IN=7d

LOG_LEVEL=debug
```

---

### 4. Створення бази даних

У PostgreSQL створи базу даних, наприклад:

```sql
CREATE DATABASE ukr_book_db;
```

Після цього виконай SQL-файл зі схемою:

```bash
cd server
psql -h localhost -U postgres -d ukr_book_db -f scripts/reset-auth-and-user-relations.sql
```

Або відкрий цей файл у DataGrip і виконай його в потрібній БД.

---

### 5. Запуск backend

```bash
cd server
npm run dev
```

Backend буде доступний за адресою:

```text
http://localhost:4000
```

Health-check:

```text
http://localhost:4000/api/health
```

Очікувана відповідь:

```json
{
  "ok": true,
  "database": true
}
```

---

### 6. Встановлення frontend-залежностей

В окремому терміналі:

```bash
cd my-app
npm install
```

---

### 7. Запуск frontend

```bash
cd my-app
npm start
```

Frontend буде доступний за адресою:

```text
http://localhost:3000
```

---

## Основні API routes

```text
/api/auth
/api/works
/api/comments
/api/me
/api/admin
/api/docs
/api/health
```

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Works

```text
GET    /api/works
GET    /api/works/:id
POST   /api/works
PUT    /api/works/:id
DELETE /api/works/:id
GET    /api/works/me
GET    /api/works/moderation/pending
PATCH  /api/works/:id/approve
PATCH  /api/works/:id/reject
```

### Comments

```text
GET    /api/comments/work/:workId
POST   /api/comments/work/:workId
PUT    /api/comments/:commentId
DELETE /api/comments/:commentId
POST   /api/comments/:commentId/like
GET    /api/comments/me
```

### User activity

```text
GET /api/me/favorite-works
POST /api/me/favorite-works/:workId/toggle

GET /api/me/reading-progress
PUT /api/me/reading-progress/:workId
DELETE /api/me/reading-progress/:workId

GET /api/me/favorite-genres
PUT /api/me/favorite-genres
```

### Admin

```text
GET /api/admin/stats
```

---

## Авторизація

Після логіну або реєстрації backend повертає:

```json
{
  "user": {
    "id": "1",
    "login": "user1",
    "email": "user1@example.com",
    "firstName": "User",
    "lastName": "One",
    "role": "user"
  },
  "token": "JWT_TOKEN"
}
```

Frontend зберігає `user` і `token` у Redux/localStorage.

Для захищених API-запитів використовується header:

```text
Authorization: Bearer JWT_TOKEN
```

---

## Створення модератора

Після реєстрації користувача роль можна змінити напряму в PostgreSQL:

```sql
UPDATE users
SET role = 'moderator'
WHERE login = 'moderator_login';
```

Після зміни ролі потрібно вийти з акаунта і зайти знову, бо роль записується в JWT під час логіну.

---

## Swagger / OpenAPI

Swagger UI доступний після запуску backend:

```text
http://localhost:4000/api/docs
```

OpenAPI JSON:

```text
http://localhost:4000/api/docs.json
```

Генерація OpenAPI-файлу:

```bash
cd server
npm run openapi:generate
```

---

## JSDoc-документація

### Frontend

```bash
cd my-app
npm run docs
```

Результат:

```text
my-app/docs/generated/frontend
```

### Backend

```bash
cd server
npm run docs
```

Результат:

```text
server/docs/generated/backend
```

---

## E2E / BDD сценарії

У frontend-частині є Cucumber / Playwright сценарії:

```text
my-app/features/authentication.feature
my-app/features/search.feature
```

Запуск:

```bash
cd my-app
npx cucumber-js
```

---

## Перевірка старих згадок

Для перевірки, що в коді не залишилося старих JSON/localStorage helper-ів:

```powershell
Get-ChildItem my-app/src,server,docs -Recurse -File | Select-String "users.json|fileDb|authService|works.json|commentsStorage|moderationStorage|favoritesStorage|readingProgressStorage|окрема СУБД не використовується|файлове сховище"
```

---

## Smoke-test

Після великих змін бажано пройти повний сценарій:

1. запустити PostgreSQL;
2. запустити backend;
3. перевірити `/api/health`;
4. запустити frontend;
5. зареєструвати користувача;
6. увійти в акаунт;
7. створити твір;
8. перевірити, що твір має статус `pending`;
9. увійти як moderator/admin;
10. підтвердити твір;
11. перевірити появу твору на головній;
12. додати коментар;
13. додати твір в обране;
14. змінити сторінку читання;
15. перевірити прогрес читання;
16. вибрати улюблені жанри;
17. перевірити рекомендоване сортування;
18. відкрити статистику.

---

## Production-документація

Детальні інструкції розміщені у папці `docs`:

- `docs/architecture.md` — архітектура;
- `docs/deployment.md` — production-розгортання;
- `docs/backup.md` — резервне копіювання;
- `docs/update.md` — оновлення production-середовища;
- `docs/performance.md` — продуктивність;
- `docs/live_documentation.md` — жива документація;
- `docs/generate_docs.md` — генерація документації.

---

## Ліцензія

Проєкт поширюється відповідно до умов, указаних у файлі `LICENSE`.