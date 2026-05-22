# Оновлення проєкту у production-середовищі

## 1. Призначення документа

Цей документ описує покрокову процедуру оновлення проєкту у production-середовищі для release engineer / DevOps-фахівця.

Інструкція охоплює:

- підготовку до оновлення;
- створення резервних копій;
- перевірку сумісності;
- оновлення коду;
- оновлення залежностей;
- оновлення схеми PostgreSQL;
- збірку frontend;
- перезапуск backend;
- перевірку після оновлення;
- процедуру відкату у разі невдалого оновлення.

---

## 2. Загальні відомості

У поточній версії проєкту production-середовище складається з таких компонентів:

- **Nginx** як вебсервер і reverse proxy;
- **frontend** як статична production-збірка React;
- **backend** як Node.js / Express-застосунок;
- **PostgreSQL** як основне сховище даних;
- **systemd** для керування backend-сервісом;
- **.env-файл** для конфігурації backend.

Оновлення проєкту виконується на сервері, де застосунок розгорнуто у каталозі:

```text
/var/www/diploma
```

Backend-сервіс у прикладах має назву:

```text
diploma-backend
```

---

## 3. Підготовка до оновлення

Перед початком оновлення потрібно:

1. визначити, яку саме версію або commit необхідно розгорнути;
2. перевірити, чи немає незавершених робіт на сервері;
3. переконатися, що є доступ до сервера, Git-репозиторію та прав sudo;
4. перевірити наявність вільного місця на диску;
5. перевірити поточний стан сервісів;
6. створити backup PostgreSQL і конфігурацій;
7. попередити користувачів про можливий короткочасний простій, якщо це потрібно.

### Перевірка вільного місця на диску

```bash
df -h
```

### Перевірка статусу сервісів

```bash
sudo systemctl status diploma-backend
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Перевірка поточної версії коду

```bash
cd /var/www/diploma

git status
git log --oneline -n 5
```

Перед оновленням робоче дерево має бути в чистому стані, без локальних незбережених змін.

---

## 4. Створення резервних копій перед оновленням

Перед будь-яким production-оновленням обов’язково потрібно створити резервні копії.

Критично важливо зберегти:

- дамп PostgreSQL;
- backend `.env`;
- конфігурацію Nginx;
- systemd unit-файл backend;
- за потреби архів поточного каталогу проєкту.

### Створення каталогу для резервних копій

```bash
sudo mkdir -p /var/backups/diploma/db
sudo mkdir -p /var/backups/diploma/config
sudo mkdir -p /var/backups/diploma/project
```

### Резервна копія PostgreSQL

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

pg_dump -h localhost -U diploma_user -d diploma_db > /var/backups/diploma/db/diploma_db_before_update-$TIMESTAMP.sql
```

Стиснений варіант:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

pg_dump -h localhost -U diploma_user -d diploma_db | gzip > /var/backups/diploma/db/diploma_db_before_update-$TIMESTAMP.sql.gz
```

### Резервна копія `.env`

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /var/www/diploma/server/.env /var/backups/diploma/config/server.env_before_update-$TIMESTAMP.bak
```

### Резервна копія конфігурації Nginx

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /etc/nginx/sites-available/diploma /var/backups/diploma/config/diploma.nginx_before_update-$TIMESTAMP.bak
```

### Резервна копія systemd unit-файлу

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /etc/systemd/system/diploma-backend.service /var/backups/diploma/config/diploma-backend_before_update-$TIMESTAMP.service.bak
```

### Повна резервна копія каталогу проєкту

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo tar -czf /var/backups/diploma/project/diploma-project_before_update-$TIMESTAMP.tar.gz /var/www/diploma
```

---

## 5. Перевірка резервних копій

Після створення backup потрібно перевірити, що файли реально створені та не порожні.

```bash
ls -lh /var/backups/diploma/db
ls -lh /var/backups/diploma/config
ls -lh /var/backups/diploma/project
```

Для `.sql.gz` backup:

```bash
gzip -t /var/backups/diploma/db/diploma_db_before_update-<timestamp>.sql.gz
```

Для архіву проєкту:

```bash
tar -tzf /var/backups/diploma/project/diploma-project_before_update-<timestamp>.tar.gz > /dev/null
```

Якщо ці команди не повернули помилок, backup-и можна вважати придатними для відновлення.

---

## 6. Отримання останніх змін з Git

Перейдіть у каталог проєкту:

```bash
cd /var/www/diploma
```

Перевірте поточний стан:

```bash
git status
```

Отримайте останні зміни:

```bash
git pull origin main
```

Після цього перевірте останні commit-и:

```bash
git log --oneline -n 5
```

---

## 7. Оновлення backend-залежностей

Якщо змінився `server/package.json` або `server/package-lock.json`, потрібно оновити залежності backend.

```bash
cd /var/www/diploma/server
npm install
```

Для більш контрольованого production-встановлення можна використовувати:

```bash
npm ci --omit=dev
```

Але `npm ci` вимагає актуальний `package-lock.json` і видаляє `node_modules` перед встановленням.

---

## 8. Оновлення frontend-залежностей

Якщо змінився `my-app/package.json` або `my-app/package-lock.json`, потрібно оновити залежності frontend.

```bash
cd /var/www/diploma/my-app
npm install
```

Для production-збірки також можна використовувати:

```bash
npm ci
```

---

## 9. Оновлення схеми PostgreSQL

Якщо в новій версії змінилася структура БД, потрібно застосувати SQL-оновлення.

У поточній версії проєкту основний SQL-файл для створення актуальної схеми:

```text
server/scripts/reset-auth-and-user-relations.sql
```

Цей файл повністю перестворює таблиці і підходить для чистого старту або тестового середовища. У production його не можна запускати без backup, якщо потрібно зберегти дані.

Для production бажано використовувати окремі migration-файли, які змінюють схему без видалення даних.

### Приклад виконання окремого migration-файлу

```bash
cd /var/www/diploma/server

psql -h localhost -U diploma_user -d diploma_db -f scripts/<migration-file>.sql
```

### Перевірка таблиць після оновлення

```bash
psql -h localhost -U diploma_user -d diploma_db
```

```sql
\dt

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM works;
SELECT COUNT(*) FROM comments;
```

Якщо оновлення схеми не потрібне, цей крок можна пропустити.

---

## 10. Збірка frontend

Після оновлення коду потрібно заново зібрати frontend:

```bash
cd /var/www/diploma/my-app
npm run build
```

Після успішної збірки оновиться каталог:

```text
/var/www/diploma/my-app/build
```

Саме цей каталог роздається через Nginx.

---

## 11. Перезапуск backend

Після оновлення backend-коду або `.env` потрібно перезапустити backend-сервіс:

```bash
sudo systemctl restart diploma-backend
```

Перевірити статус:

```bash
sudo systemctl status diploma-backend
```

Переглянути останні логи:

```bash
sudo journalctl -u diploma-backend -n 100 --no-pager
```

---

## 12. Перезавантаження Nginx

Якщо змінювалася конфігурація Nginx, потрібно перевірити її та перезавантажити сервіс:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Якщо конфігурація Nginx не змінювалася, достатньо оновити frontend build і перезапустити backend.

---

## 13. Перевірка після оновлення

## 13.1. Перевірка backend health endpoint

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

Якщо `database` має значення `false`, потрібно перевірити:

- чи працює PostgreSQL;
- чи правильні значення в `.env`;
- чи існує база даних;
- чи має користувач БД потрібні права;
- чи застосовані потрібні SQL-оновлення.

---

## 13.2. Перевірка API через Nginx

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

## 13.3. Перевірка frontend

У браузері потрібно перевірити:

- головну сторінку;
- сторінки логіну та реєстрації;
- особистий кабінет;
- сторінку створення твору;
- сторінку модерації;
- сторінку статистики;
- сторінку окремого твору.

---

## 13.4. Повний smoke-test

Після оновлення бажано пройти мінімальний сценарій:

1. зареєструвати нового користувача;
2. увійти в систему;
3. створити новий твір;
4. перевірити, що твір отримав статус `pending`;
5. увійти як модератор або адміністратор;
6. підтвердити твір;
7. перевірити, що твір з’явився на головній сторінці;
8. залишити коментар і оцінку;
9. додати твір в обране;
10. змінити сторінку читання і перевірити прогрес;
11. вибрати улюблені жанри;
12. відкрити сторінку статистики.

---

## 14. Перевірка логів після оновлення

Backend:

```bash
sudo journalctl -u diploma-backend -n 200 --no-pager
```

Nginx:

```bash
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

PostgreSQL:

```bash
sudo journalctl -u postgresql -n 100 --no-pager
```

У логах не повинно бути критичних помилок, пов’язаних із:

- запуском backend;
- підключенням до PostgreSQL;
- виконанням SQL-запитів;
- проксіюванням API;
- віддачею frontend build.

---

## 15. Типові проблеми після оновлення

### Backend не запускається

Перевірити:

```bash
sudo systemctl status diploma-backend
sudo journalctl -u diploma-backend -n 100 --no-pager
```

Можливі причини:

- помилка у `.env`;
- відсутня залежність після оновлення;
- синтаксична помилка в коді;
- неправильний шлях у systemd unit-файлі;
- PostgreSQL недоступний.

---

### `/api/health` повертає `database: false`

Перевірити:

```bash
sudo systemctl status postgresql
psql -h localhost -U diploma_user -d diploma_db
```

Можливі причини:

- PostgreSQL не запущений;
- неправильні `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`;
- користувач БД не має прав;
- база даних не створена;
- таблиці не створені або пошкоджені.

---

### Frontend відкривається, але API не працює

Перевірити Nginx:

```bash
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

Можливі причини:

- неправильний `proxy_pass`;
- backend не працює;
- backend слухає інший порт;
- запити до `/api/` не проксіюються на backend.

---

### Користувач не має доступу до сторінки модерації

Перевірити роль у PostgreSQL:

```sql
SELECT id, login, email, role
FROM users
ORDER BY id DESC;
```

Якщо потрібно зробити користувача модератором:

```sql
UPDATE users
SET role = 'moderator'
WHERE login = 'moderator_login';
```

Після зміни ролі користувач має вийти з акаунта і увійти знову, тому що роль записується в JWT під час логіну.

---

## 16. Відкат після невдалого оновлення

Якщо після оновлення система працює некоректно, потрібно виконати rollback.

Rollback може включати:

- повернення попередньої версії коду;
- відновлення PostgreSQL з backup;
- відновлення `.env`;
- відновлення конфігурації Nginx;
- відновлення systemd unit-файлу;
- перезапуск сервісів.

---

## 17. Відкат коду через Git

Перейдіть у каталог проєкту:

```bash
cd /var/www/diploma
```

Подивіться останні commit-и:

```bash
git log --oneline -n 10
```

Поверніться до попереднього стабільного commit-а:

```bash
git checkout <stable_commit_hash>
```

Після цього оновіть залежності та перебудуйте frontend:

```bash
cd /var/www/diploma/server
npm install

cd /var/www/diploma/my-app
npm install
npm run build

sudo systemctl restart diploma-backend
sudo systemctl reload nginx
```

---

## 18. Відновлення PostgreSQL з backup

Перед відновленням бажано зупинити backend:

```bash
sudo systemctl stop diploma-backend
```

### Відновлення зі звичайного `.sql`

```bash
psql -h localhost -U diploma_user -d diploma_db < /var/backups/diploma/db/diploma_db_before_update-<timestamp>.sql
```

### Відновлення зі стисненого `.sql.gz`

```bash
gunzip -c /var/backups/diploma/db/diploma_db_before_update-<timestamp>.sql.gz | psql -h localhost -U diploma_user -d diploma_db
```

Після відновлення:

```bash
sudo systemctl start diploma-backend
sudo systemctl status diploma-backend
curl http://127.0.0.1:4000/api/health
```

---

## 19. Відновлення конфігурацій

### Відновлення `.env`

```bash
sudo cp /var/backups/diploma/config/server.env_before_update-<timestamp>.bak /var/www/diploma/server/.env
sudo systemctl restart diploma-backend
```

### Відновлення Nginx

```bash
sudo cp /var/backups/diploma/config/diploma.nginx_before_update-<timestamp>.bak /etc/nginx/sites-available/diploma
sudo nginx -t
sudo systemctl reload nginx
```

### Відновлення systemd unit-файлу

```bash
sudo cp /var/backups/diploma/config/diploma-backend_before_update-<timestamp>.service.bak /etc/systemd/system/diploma-backend.service
sudo systemctl daemon-reload
sudo systemctl restart diploma-backend
```

---

## 20. Перевірка після rollback

Після rollback потрібно перевірити:

```bash
sudo systemctl status diploma-backend
sudo systemctl status nginx
sudo systemctl status postgresql

curl http://127.0.0.1:4000/api/health
curl http://your-domain.example/api/health
```

Також потрібно вручну перевірити:

- відкриття frontend;
- логін і реєстрацію;
- створення твору;
- модерацію;
- коментарі;
- обране;
- прогрес читання;
- сторінку статистики.

---

## 21. Коротка схема оновлення

1. перевірити стан сервісів;
2. створити backup PostgreSQL;
3. створити backup `.env`, Nginx і systemd;
4. виконати `git pull origin main`;
5. оновити backend-залежності;
6. оновити frontend-залежності;
7. за потреби застосувати SQL migration;
8. виконати `npm run build` для frontend;
9. перезапустити backend;
10. перевірити або перезавантажити Nginx;
11. перевірити `/api/health`;
12. пройти smoke-test;
13. перевірити логи.

---

## 22. Ознаки успішного оновлення

Оновлення вважається успішним, якщо:

- backend-сервіс має статус `active (running)`;
- PostgreSQL має статус `active`;
- Nginx працює без помилок;
- `/api/health` повертає `database: true`;
- frontend відкривається у браузері;
- API-запити проходять через Nginx;
- користувачі можуть реєструватися і входити;
- твори створюються і проходять модерацію;
- коментарі, обране, прогрес читання та жанри зберігаються у PostgreSQL;
- сторінка статистики отримує актуальні дані;
- у логах немає критичних помилок.