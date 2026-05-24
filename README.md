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
- видалення творів з обраного через особистий кабінет;
- прогрес читання;
- улюблені жанри;
- рекомендоване сортування за улюбленими жанрами;
- особистий кабінет користувача;
- публічні профілі користувачів;
- перегляд опублікованих творів конкретного користувача;
- перехід на профіль автора твору;
- перехід на профіль автора коментаря;
- адміністративна статистика;
- адаптивний інтерфейс для desktop, tablet і mobile;
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

## Основні frontend-сторінки

- `HomePage` — головна сторінка з каталогом творів;
- `LoginPage` — сторінка входу;
- `RegisterPage` — сторінка реєстрації;
- `CabinetPage` — особистий кабінет користувача;
- `CreateWorkPage` — створення нового твору;
- `EditWorkPage` — редагування твору;
- `WorkDetailsPage` — перегляд твору, читання сторінок, коментарі, оцінки та обране;
- `UserProfilePage` — публічний профіль користувача;
- `AdminPage` — модерація творів;
- `AdminStatsPage` — статистика адміністратора.

---

## Основні backend-модулі

### Routes

- `auth.routes.js` — реєстрація, логін, поточний користувач;
- `work.routes.js` — твори, сторінки творів, модерація;
- `comment.routes.js` — коментарі, оцінки, лайки;
- `userActivity.routes.js` — обране, прогрес читання, улюблені жанри;
- `user.routes.js` — публічні профілі користувачів;
- `adminStats.routes.js` — адміністративна статистика.

### Utils

- `db.js` — підключення до PostgreSQL, SQL-запити, транзакції;
- `userDb.js` — робота з таблицею `users`;
- `workDb.js` — робота з таблицями `works` і `work_pages`;
- `commentDb.js` — робота з `comments` і `comment_likes`;
- `userActivityDb.js` — робота з `favorite_works`, `reading_progress`, `favorite_genres`;
- `userProfileDb.js` — отримання публічного профілю користувача та його опублікованих творів;
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

Основні зв’язки:

- `works.author_id` → `users.id`;
- `comments.user_id` → `users.id`;
- `comments.work_id` → `works.id`;
- `comment_likes.user_id` → `users.id`;
- `comment_likes.comment_id` → `comments.id`;
- `favorite_works.user_id` → `users.id`;
- `favorite_works.work_id` → `works.id`;
- `reading_progress.user_id` → `users.id`;
- `reading_progress.work_id` → `works.id`;
- `favorite_genres.user_id` → `users.id`.

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
/api/users
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
GET    /api/me/favorite-works
POST   /api/me/favorite-works/:workId/toggle

GET    /api/me/reading-progress
PUT    /api/me/reading-progress/:workId
DELETE /api/me/reading-progress/:workId

GET    /api/me/favorite-genres
PUT    /api/me/favorite-genres
```

### Users

```text
GET /api/users/:id/profile
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

## Ролі користувачів

У системі є три ролі:

- `user` — звичайний користувач;
- `moderator` — модератор;
- `admin` — адміністратор.

Звичайний користувач може:

- створювати твори;
- редагувати власні твори;
- коментувати твори;
- ставити оцінки;
- додавати твори в обране;
- видаляти твори з обраного;
- зберігати прогрес читання;
- обирати улюблені жанри;
- переглядати публічні профілі інших користувачів.

Модератор або адміністратор може:

- переглядати твори на модерації;
- підтверджувати твори;
- відхиляти твори;
- вказувати причину відхилення;
- переглядати адміністративну статистику.

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

## Публічні профілі користувачів

Публічний профіль доступний за маршрутом frontend:

```text
/users/:id
```

Дані завантажуються через backend endpoint:

```text
GET /api/users/:id/profile
```

Профіль користувача містить:

- логін;
- ім’я та прізвище;
- роль;
- дату реєстрації;
- кількість опублікованих творів;
- кількість коментарів;
- кількість додавань в обране;
- список опублікованих творів.

Перехід на профіль доступний через:

- ім’я автора твору;
- ім’я автора коментаря.

Публічний профіль не повертає приватні дані користувача, наприклад пароль або `password_hash`.

---

## Обране

Користувач може додавати твори в обране зі сторінки твору.

Також у кабінеті користувача є кнопка:

```text
Видалити з обраного
```

Вона дозволяє прибрати твір зі списку обраного без переходу на сторінку твору.

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

Generated-документація створюється автоматично з JSDoc-коментарів і не редагується вручну.

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
12. відкрити сторінку твору;
13. натиснути на автора твору і перевірити відкриття профілю;
14. додати коментар;
15. натиснути на автора коментаря і перевірити відкриття профілю;
16. додати твір в обране;
17. перейти в кабінет;
18. видалити твір з обраного через кнопку `Видалити з обраного`;
19. перевірити, що твір зник зі списку обраного;
20. змінити сторінку читання;
21. перевірити прогрес читання;
22. вибрати улюблені жанри;
23. перевірити рекомендоване сортування;
24. відкрити статистику.

---

## Адаптивність

Інтерфейс адаптований для:

- desktop;
- tablets;
- mobile devices.

Після змін у frontend або CSS бажано перевіряти ширини:

```text
320px
375px
430px
768px
1024px
```

Основні сторінки для перевірки:

```text
/
/login
/register
/cabinet
/works/create
/works/edit/:id
/works/:id
/users/:id
/admin
/admin/stats
```

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