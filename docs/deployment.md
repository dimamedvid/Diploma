# Розгортання проєкту у production-середовищі

## 1. Призначення документа

Цей документ описує порядок розгортання інформаційної вебсистеми для створення, перегляду та оцінювання авторських літературних творів у production-середовищі.

Інструкція орієнтована на release engineer / DevOps-фахівця та охоплює:

- вимоги до апаратного забезпечення;
- необхідне програмне забезпечення;
- налаштування мережі;
- конфігурацію frontend, backend і PostgreSQL;
- розгортання коду;
- налаштування змінних оточення;
- запуск backend як systemd-сервісу;
- налаштування Nginx як reverse proxy;
- перевірку працездатності після розгортання.

---

## 2. Загальна схема production-розгортання

У production-середовищі проєкт доцільно розгортати за такою схемою:

- **Nginx** використовується як вебсервер і reverse proxy;
- **frontend** збирається у production-build та роздається як статичний застосунок;
- **backend** запускається як Node.js / Express-застосунок;
- **PostgreSQL** використовується як основне сховище даних;
- **systemd** використовується для керування backend-процесом;
- конфігурація backend зберігається у `.env`.

### Основні компоненти production-архітектури

- **Web server**: Nginx;
- **Application server**: Node.js + Express;
- **Database**: PostgreSQL;
- **Process manager**: systemd;
- **Frontend build**: React production build;
- **API documentation**: Swagger / OpenAPI;
- **Кешування**: не використовується;
- **Контейнеризація**: не використовується у поточній версії.

---

## 3. Вимоги до апаратного забезпечення

### Підтримувана архітектура

Рекомендовано використовувати сервер з однією з таких архітектур:

- **x86_64 / amd64**;
- **ARM64**, якщо всі потрібні пакети Node.js, PostgreSQL та Nginx підтримуються системою.

### Мінімальні апаратні вимоги

Для невеликого production-розгортання достатньо:

- **CPU**: 2 vCPU;
- **RAM**: 2 GB;
- **Диск**: 20 GB SSD;
- **Мережа**: стабільне підключення до інтернету з відкритими портами для HTTP/HTTPS.

### Рекомендовані вимоги

Для стабільнішої роботи та запасу на зростання:

- **CPU**: 2–4 vCPU;
- **RAM**: 4 GB;
- **Диск**: 40 GB SSD;
- **Резерв вільного місця**: не менше 10 GB для логів, збірок, дампів БД і резервних копій.

---

## 4. Необхідне програмне забезпечення

Для production-розгортання на сервері потрібно встановити:

- **Ubuntu Server 22.04 LTS** або новішу сумісну версію;
- **Git**;
- **Node.js LTS**;
- **npm**;
- **Nginx**;
- **PostgreSQL**;
- **systemd**;
- за потреби **ufw** для базового керування мережевим доступом.

### Приклад встановлення необхідного ПЗ

```bash
sudo apt update
sudo apt install -y git nginx curl postgresql postgresql-contrib

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### Перевірка встановлення

```bash
node -v
npm -v
git --version
nginx -v
psql --version
```

---

## 5. Налаштування мережі

### Необхідні мережеві порти

Для коректної роботи production-середовища потрібно:

- відкрити порт **80** для HTTP;
- відкрити порт **443** для HTTPS;
- не відкривати зовні порт backend, якщо він працює лише через reverse proxy;
- PostgreSQL бажано не відкривати в інтернет, якщо база працює на тому ж сервері;
- внутрішній backend-сервіс може працювати на `127.0.0.1:4000`.

### Рекомендована мережева схема

- Nginx приймає зовнішні HTTP/HTTPS-запити;
- frontend build віддається напряму через Nginx;
- запити до `/api/` проксіюються з Nginx на backend;
- backend працює на локальному порту `4000`;
- backend підключається до PostgreSQL через локальний host або внутрішню мережу.

### Приклад базового налаштування UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 6. Підготовка каталогу проєкту

Рекомендовано розміщувати застосунок у каталозі:

```text
/var/www/diploma
```

### Створення каталогу

```bash
sudo mkdir -p /var/www/diploma
sudo chown -R $USER:$USER /var/www/diploma
cd /var/www/diploma
```

### Отримання коду з репозиторію

```bash
git clone https://github.com/dimamedvid/Diploma.git .
```

Якщо проєкт уже розгортався раніше:

```bash
git pull origin main
```

---

## 7. Встановлення залежностей

### Backend

```bash
cd /var/www/diploma/server
npm install
```

### Frontend

```bash
cd /var/www/diploma/my-app
npm install
```

---

## 8. Налаштування PostgreSQL

## 8.1. Створення користувача та бази даних

Увійдіть у PostgreSQL:

```bash
sudo -u postgres psql
```

Створіть користувача та базу даних:

```sql
CREATE USER diploma_user WITH PASSWORD 'strong_password_here';

CREATE DATABASE diploma_db OWNER diploma_user;

GRANT ALL PRIVILEGES ON DATABASE diploma_db TO diploma_user;
```

Вийдіть з `psql`:

```sql
\q
```

### Перевірка підключення

```bash
psql -h localhost -U diploma_user -d diploma_db
```

---

## 8.2. Створення таблиць

У проєкті використовується SQL-файл:

```text
server/scripts/reset-auth-and-user-relations.sql
```

Для створення актуальної структури БД виконайте:

```bash
cd /var/www/diploma/server

psql -h localhost -U diploma_user -d diploma_db -f scripts/reset-auth-and-user-relations.sql
```

Після виконання мають бути створені таблиці:

- `users`;
- `works`;
- `work_pages`;
- `comments`;
- `comment_likes`;
- `favorite_works`;
- `reading_progress`;
- `favorite_genres`.

### Перевірка таблиць

```bash
psql -h localhost -U diploma_user -d diploma_db
```

```sql
\dt
```

---

## 9. Налаштування backend `.env`

У папці backend потрібно створити файл:

```text
/var/www/diploma/server/.env
```

Приклад вмісту:

```env
NODE_ENV=production
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=diploma_db
DB_USER=diploma_user
DB_PASSWORD=strong_password_here

JWT_SECRET=replace_this_with_long_random_secret
JWT_EXPIRES_IN=7d

LOG_LEVEL=info
```

### Важливі змінні

- `PORT` — порт backend-сервера;
- `DB_HOST` — host PostgreSQL;
- `DB_PORT` — порт PostgreSQL;
- `DB_NAME` — назва бази даних;
- `DB_USER` — користувач бази даних;
- `DB_PASSWORD` — пароль користувача бази даних;
- `JWT_SECRET` — секрет для підпису JWT-токенів;
- `JWT_EXPIRES_IN` — строк дії JWT-токена.

У production значення `JWT_SECRET` має бути довгим, випадковим і не повинно зберігатися у відкритому репозиторії.

---

## 10. Збірка frontend

У production frontend повинен бути зібраний у статичний build:

```bash
cd /var/www/diploma/my-app
npm run build
```

Після цього з’явиться каталог:

```text
/var/www/diploma/my-app/build
```

Саме цей каталог буде роздаватися через Nginx.

---

## 11. Запуск backend як systemd-сервісу

Для production рекомендується запускати backend через `systemd`.

### Створення unit-файлу

Створіть файл:

```text
/etc/systemd/system/diploma-backend.service
```

З таким вмістом:

```ini
[Unit]
Description=Diploma Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/diploma/server
ExecStart=/usr/bin/node /var/www/diploma/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
```

### Налаштування прав доступу

Оскільки backend запускається від користувача `www-data`, потрібно надати права на читання проєкту:

```bash
sudo chown -R www-data:www-data /var/www/diploma/server
sudo chmod -R 750 /var/www/diploma/server
```

Якщо frontend build роздається Nginx, також можна надати права для читання frontend build:

```bash
sudo chown -R www-data:www-data /var/www/diploma/my-app/build
sudo chmod -R 755 /var/www/diploma/my-app/build
```

### Активація сервісу

```bash
sudo systemctl daemon-reload
sudo systemctl enable diploma-backend
sudo systemctl start diploma-backend
```

### Перевірка статусу

```bash
sudo systemctl status diploma-backend
```

### Перегляд логів backend

```bash
sudo journalctl -u diploma-backend -n 100 --no-pager
```

---

## 12. Конфігурація Nginx

Створіть файл конфігурації:

```text
/etc/nginx/sites-available/diploma
```

Приклад конфігурації:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    root /var/www/diploma/my-app/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Активація конфігурації

```bash
sudo ln -s /etc/nginx/sites-available/diploma /etc/nginx/sites-enabled/diploma
sudo nginx -t
sudo systemctl restart nginx
```

Якщо конфігурація з такою назвою вже була активована раніше, символічне посилання повторно створювати не потрібно.

---

## 13. HTTPS

Для production-середовища бажано підключити HTTPS через Let’s Encrypt.

Приклад встановлення Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Отримання сертифіката:

```bash
sudo certbot --nginx -d your-domain.example
```

Перевірка автоматичного оновлення:

```bash
sudo certbot renew --dry-run
```

---

## 14. Перевірка працездатності після розгортання

## 14.1. Перевірка backend-сервісу

```bash
sudo systemctl status diploma-backend
```

Сервіс повинен мати статус:

```text
active (running)
```

---

## 14.2. Перевірка PostgreSQL

```bash
sudo systemctl status postgresql
```

Також можна перевірити підключення до бази:

```bash
psql -h localhost -U diploma_user -d diploma_db
```

---

## 14.3. Перевірка backend локально

```bash
curl http://127.0.0.1:4000/api/health
```

Очікувана відповідь:

```json
{
  "ok": true,
  "database": true
}
```

Якщо `database` має значення `false`, потрібно перевірити `.env`, доступність PostgreSQL та правильність даних підключення.

---

## 14.4. Перевірка API через Nginx

```bash
curl http://your-domain.example/api/health
```

Очікувана відповідь:

```json
{
  "ok": true,
  "database": true
}
```

---

## 14.5. Перевірка frontend у браузері

Потрібно відкрити домен або IP-адресу сервера в браузері та перевірити:

- завантаження головної сторінки;
- коректне відображення списку творів;
- роботу маршрутизації між сторінками;
- відкриття сторінок входу та реєстрації;
- відсутність помилок у браузерній консолі.

---

## 14.6. Перевірка взаємодії frontend і backend

Потрібно перевірити:

1. реєстрацію нового користувача;
2. вхід у систему;
3. створення нового твору;
4. появу твору у статусі `pending`;
5. доступ до сторінки модерації для користувача з роллю `moderator` або `admin`;
6. підтвердження або відхилення твору;
7. появу підтвердженого твору на головній сторінці;
8. додавання коментаря;
9. додавання твору в обране;
10. збереження прогресу читання;
11. вибір улюблених жанрів;
12. відкриття сторінки статистики.

---

## 14.7. Перевірка логів

Логи backend:

```bash
sudo journalctl -u diploma-backend -n 100 --no-pager
```

Логи Nginx:

```bash
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

У логах не повинно бути критичних помилок, пов’язаних із запуском backend, підключенням до PostgreSQL або проксіюванням API.

---

## 15. Початкове створення модератора

Після реєстрації звичайного користувача роль можна змінити напряму в PostgreSQL.

Увійдіть у базу:

```bash
psql -h localhost -U diploma_user -d diploma_db
```

Виконайте:

```sql
UPDATE users
SET role = 'moderator'
WHERE login = 'moderator_login';
```

Після зміни ролі користувач має вийти з акаунта і увійти знову, тому що роль записується в JWT-токен під час логіну.

Для перевірки:

```sql
SELECT id, login, email, role
FROM users
ORDER BY id DESC;
```

---

## 16. Оновлення production-версії

Для оновлення вже розгорнутого проєкту потрібно:

1. перейти в каталог проєкту;
2. отримати останні зміни з Git;
3. встановити нові залежності;
4. за потреби виконати SQL-оновлення схеми;
5. перебудувати frontend;
6. перезапустити backend;
7. перевірити працездатність.

### Команди оновлення

```bash
cd /var/www/diploma

git pull origin main

cd server
npm install

cd ../my-app
npm install
npm run build

sudo systemctl restart diploma-backend
sudo systemctl reload nginx
```

### Перевірка після оновлення

```bash
curl http://127.0.0.1:4000/api/health
sudo systemctl status diploma-backend
sudo nginx -t
```

---

## 17. Резервне копіювання перед оновленням

Перед production-оновленням бажано зробити резервну копію бази даних:

```bash
pg_dump -h localhost -U diploma_user -d diploma_db > /var/backups/diploma/diploma_db_before_update.sql
```

Також бажано зберегти `.env` і конфігурацію Nginx:

```bash
sudo cp /var/www/diploma/server/.env /var/backups/diploma/server.env.bak
sudo cp /etc/nginx/sites-available/diploma /var/backups/diploma/diploma.nginx.bak
```

---

## 18. Відновлення з резервної копії бази даних

Якщо потрібно відновити базу з dump-файлу:

```bash
psql -h localhost -U diploma_user -d diploma_db < /var/backups/diploma/diploma_db_before_update.sql
```

Перед відновленням бажано зупинити backend:

```bash
sudo systemctl stop diploma-backend
```

Після відновлення:

```bash
sudo systemctl start diploma-backend
sudo systemctl status diploma-backend
```

---

## 19. Ознаки успішного production-розгортання

Розгортання вважається успішним, якщо виконуються всі умови:

- Nginx запущений без помилок;
- PostgreSQL запущений і доступний;
- backend-сервіс працює через `systemd`;
- frontend відкривається у браузері;
- API-запити успішно проходять через reverse proxy;
- `/api/health` повертає `database: true`;
- реєстрація та авторизація користувачів працюють коректно;
- створення, модерація та перегляд творів працюють коректно;
- коментарі, обране, прогрес читання та улюблені жанри зберігаються у PostgreSQL;
- сторінка статистики отримує дані з backend;
- у логах відсутні критичні помилки.

---

## 20. Особливості поточної версії проєкту

Поточна production-схема має такі особливості:

- PostgreSQL використовується як основне сховище даних;
- backend працює через Node.js / Express;
- frontend розгортається як статичний React build;
- backend запускається через `systemd`;
- Nginx використовується для роздачі frontend і проксіювання API;
- Docker Compose у поточній версії не використовується;
- автоматичні міграції ще не реалізовані, схема БД створюється SQL-файлом;
- localStorage використовується тільки на frontend для збереження поточного auth-стану користувача.

У майбутніх версіях доцільно розглянути:

- автоматичні міграції бази даних;
- Docker Compose для локального і production-розгортання;
- автоматизований CI/CD pipeline;
- централізоване логування;
- моніторинг стану backend, PostgreSQL і Nginx;
- регулярні автоматичні backup-и PostgreSQL.