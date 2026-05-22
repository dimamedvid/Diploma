# Резервне копіювання проєкту у production-середовищі

## 1. Призначення документа

Цей документ описує рекомендації для release engineer / DevOps щодо резервного копіювання та відновлення проєкту у production-середовищі.

Документ охоплює:

- стратегію резервного копіювання;
- типи резервних копій;
- частоту створення резервних копій;
- правила зберігання та ротації;
- резервне копіювання PostgreSQL;
- резервне копіювання конфігурацій;
- резервне копіювання коду проєкту;
- перевірку цілісності резервних копій;
- автоматизацію backup-процесу;
- процедуру відновлення після збою.

---

## 2. Загальні відомості

У поточній версії проєкту production-середовище складається з таких компонентів:

- **Nginx** як вебсервер і reverse proxy;
- **frontend** як статична production-збірка React;
- **backend** як Node.js / Express-застосунок;
- **PostgreSQL** як основне сховище даних;
- **systemd** для керування backend-сервісом;
- **.env-файл** для конфігурації backend.

Проєкт розгортається у каталозі:

```text
/var/www/diploma
```

Основним джерелом даних є база PostgreSQL.

У базі зберігаються:

- користувачі;
- твори;
- сторінки творів;
- коментарі;
- лайки коментарів;
- обрані твори;
- прогрес читання;
- улюблені жанри.

Файлове JSON-сховище користувачів більше не використовується.

---

## 3. Що потрібно резервувати

До резервного копіювання потрібно включати:

- дамп PostgreSQL;
- backend `.env`;
- конфігурацію Nginx;
- unit-файл systemd;
- production-збірку frontend або весь каталог проєкту;
- логи backend і Nginx, якщо вони потрібні для аудиту та діагностики.

Критично важливі дані:

```text
PostgreSQL database
server/.env
/etc/nginx/sites-available/diploma
/etc/systemd/system/diploma-backend.service
```

---

## 4. Стратегія резервного копіювання

Для цього проєкту рекомендовано використовувати комбіновану стратегію резервного копіювання:

- **щоденні резервні копії PostgreSQL**;
- **резервні копії конфігурацій після кожної зміни**;
- **періодичні повні резервні копії всього проєкту**;
- **обов’язкові резервні копії перед кожним production-оновленням**.

Основна мета резервного копіювання:

- захистити дані користувачів і творів від втрати;
- забезпечити можливість швидкого відновлення після помилки оновлення;
- зберегти робочі конфігурації сервера;
- забезпечити відкат до попереднього стабільного стану.

---

## 5. Типи резервних копій

### 5.1. Резервна копія бази даних

Резервна копія PostgreSQL створюється за допомогою `pg_dump`.

Вона містить:

- структуру таблиць;
- користувачів системи;
- твори;
- сторінки творів;
- коментарі;
- лайки;
- обране;
- прогрес читання;
- улюблені жанри.

Це основний тип backup для даних застосунку.

---

### 5.2. Резервна копія конфігурацій

До конфігурацій належать:

- `.env` backend;
- конфігурація Nginx;
- systemd unit-файл backend.

Такі файли потрібно копіювати після кожної зміни, бо без них застосунок може не запуститися навіть за наявності коду і бази даних.

---

### 5.3. Повна резервна копія проєкту

Повна резервна копія містить увесь каталог проєкту:

```text
/var/www/diploma
```

Вона корисна для швидкого відновлення коду, frontend build, backend-файлів і допоміжних скриптів.

---

### 5.4. Резервна копія логів

Логи не завжди є критичними для відновлення, але можуть бути корисні для:

- аналізу помилок;
- аудиту;
- перевірки причин збою;
- діагностики після невдалого оновлення.

---

## 6. Частота створення резервних копій

Рекомендована частота:

- **щодня** — backup PostgreSQL;
- **перед кожним оновленням** — backup PostgreSQL, `.env`, Nginx і systemd;
- **щотижня** — повний backup каталогу проєкту;
- **щомісяця** — архівна контрольна копія, яку зберігають довше за звичайні.

Якщо у системі активно додаються твори та коментарі, backup PostgreSQL можна виконувати кожні 6 або 12 годин.

---

## 7. Зберігання та ротація копій

### 7.1. Каталог зберігання

Рекомендовано зберігати резервні копії у каталозі:

```text
/var/backups/diploma
```

### 7.2. Структура каталогів

```text
/var/backups/diploma/db
/var/backups/diploma/config
/var/backups/diploma/project
/var/backups/diploma/logs
```

### 7.3. Правила зберігання

Рекомендована схема ротації:

- щоденні backup-и бази даних зберігати **7 днів**;
- щотижневі повні backup-и проєкту зберігати **4 тижні**;
- щомісячні архівні копії зберігати **3–6 місяців**;
- backup-и перед оновленнями зберігати щонайменше до наступного стабільного релізу.

---

## 8. Підготовка до резервного копіювання

Перед створенням backup потрібно:

1. перевірити наявність місця на диску;
2. переконатися, що каталог `/var/backups/diploma` існує;
3. перевірити доступ до PostgreSQL;
4. перевірити наявність `.env`;
5. визначити, які саме дані потрібно резервувати.

### Перевірка вільного місця

```bash
df -h
```

### Створення каталогів

```bash
sudo mkdir -p /var/backups/diploma/db
sudo mkdir -p /var/backups/diploma/config
sudo mkdir -p /var/backups/diploma/project
sudo mkdir -p /var/backups/diploma/logs
```

---

## 9. Резервне копіювання PostgreSQL

## 9.1. Створення дампу бази даних

Приклад створення backup PostgreSQL:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

pg_dump -h localhost -U diploma_user -d diploma_db > /var/backups/diploma/db/diploma_db-$TIMESTAMP.sql
```

Якщо потрібен стислий backup:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

pg_dump -h localhost -U diploma_user -d diploma_db | gzip > /var/backups/diploma/db/diploma_db-$TIMESTAMP.sql.gz
```

---

## 9.2. Перевірка створеного дампу

Для звичайного `.sql` файлу:

```bash
ls -lh /var/backups/diploma/db
head -n 20 /var/backups/diploma/db/diploma_db-<timestamp>.sql
```

Для `.sql.gz` файлу:

```bash
gzip -t /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz
```

Якщо `gzip -t` не повернув помилку, архів не пошкоджений.

---

## 9.3. Резервна копія перед оновленням

Перед production-оновленням бажано створювати окремий backup з очевидною назвою:

```bash
pg_dump -h localhost -U diploma_user -d diploma_db > /var/backups/diploma/db/diploma_db_before_update.sql
```

---

## 10. Резервне копіювання конфігурацій

## 10.1. Backend `.env`

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /var/www/diploma/server/.env /var/backups/diploma/config/server.env-$TIMESTAMP.bak
```

## 10.2. Конфігурація Nginx

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /etc/nginx/sites-available/diploma /var/backups/diploma/config/diploma.nginx-$TIMESTAMP.bak
```

## 10.3. Unit-файл systemd

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /etc/systemd/system/diploma-backend.service /var/backups/diploma/config/diploma-backend-$TIMESTAMP.service.bak
```

---

## 11. Повна резервна копія каталогу проєкту

Повна копія каталогу проєкту:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo tar -czf /var/backups/diploma/project/diploma-project-$TIMESTAMP.tar.gz /var/www/diploma
```

Перевірка архіву:

```bash
tar -tzf /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz > /dev/null
```

---

## 12. Резервне копіювання логів

### Логи backend через journalctl

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo journalctl -u diploma-backend -n 1000 --no-pager > /var/backups/diploma/logs/diploma-backend-$TIMESTAMP.log
```

### Логи Nginx

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)

sudo cp /var/log/nginx/access.log /var/backups/diploma/logs/nginx-access-$TIMESTAMP.log
sudo cp /var/log/nginx/error.log /var/backups/diploma/logs/nginx-error-$TIMESTAMP.log
```

---

## 13. Автоматизація резервного копіювання

Для автоматизації резервного копіювання доцільно використовувати shell-скрипт і `cron`.

### Приклад скрипта `scripts/backup-prod.sh`

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/diploma"
BACKUP_ROOT="/var/backups/diploma"
TIMESTAMP="$(date +%F-%H-%M-%S)"

DB_NAME="diploma_db"
DB_USER="diploma_user"
DB_HOST="localhost"

DB_DIR="$BACKUP_ROOT/db"
CONFIG_DIR="$BACKUP_ROOT/config"
PROJECT_DIR="$BACKUP_ROOT/project"
LOG_DIR="$BACKUP_ROOT/logs"

mkdir -p "$DB_DIR" "$CONFIG_DIR" "$PROJECT_DIR" "$LOG_DIR"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_DIR/diploma_db-$TIMESTAMP.sql.gz"

if [ -f "$APP_DIR/server/.env" ]; then
  cp "$APP_DIR/server/.env" "$CONFIG_DIR/server.env-$TIMESTAMP.bak"
fi

if [ -f /etc/nginx/sites-available/diploma ]; then
  cp /etc/nginx/sites-available/diploma "$CONFIG_DIR/diploma.nginx-$TIMESTAMP.bak"
fi

if [ -f /etc/systemd/system/diploma-backend.service ]; then
  cp /etc/systemd/system/diploma-backend.service "$CONFIG_DIR/diploma-backend-$TIMESTAMP.service.bak"
fi

tar -czf "$PROJECT_DIR/diploma-project-$TIMESTAMP.tar.gz" "$APP_DIR"

journalctl -u diploma-backend -n 1000 --no-pager > "$LOG_DIR/diploma-backend-$TIMESTAMP.log" || true

if [ -f /var/log/nginx/access.log ]; then
  cp /var/log/nginx/access.log "$LOG_DIR/nginx-access-$TIMESTAMP.log"
fi

if [ -f /var/log/nginx/error.log ]; then
  cp /var/log/nginx/error.log "$LOG_DIR/nginx-error-$TIMESTAMP.log"
fi

find "$DB_DIR" -type f -mtime +7 -delete
find "$CONFIG_DIR" -type f -mtime +30 -delete
find "$PROJECT_DIR" -type f -mtime +30 -delete
find "$LOG_DIR" -type f -mtime +14 -delete

echo "Backup completed: $TIMESTAMP"
```

### Права на виконання

```bash
chmod +x scripts/backup-prod.sh
```

### Автоматичний запуск через cron

Відкрити cron:

```bash
crontab -e
```

Додати щоденний запуск о 02:30:

```cron
30 2 * * * /var/www/diploma/scripts/backup-prod.sh >> /var/log/diploma-backup.log 2>&1
```

---

## 14. Перевірка цілісності резервних копій

Після створення резервних копій потрібно перевірити:

- чи файл або архів реально створився;
- чи його розмір не дорівнює нулю;
- чи backup бази можна прочитати;
- чи архів проєкту відкривається;
- чи конфігураційні файли були скопійовані.

### Перевірка списку backup-файлів

```bash
ls -lh /var/backups/diploma/db
ls -lh /var/backups/diploma/config
ls -lh /var/backups/diploma/project
ls -lh /var/backups/diploma/logs
```

### Перевірка gzip backup бази

```bash
gzip -t /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz
```

### Перевірка архіву проєкту

```bash
tar -tzf /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz > /dev/null
```

### Контрольна сума

```bash
sha256sum /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz
sha256sum /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz
```

Контрольні суми бажано зберігати разом із резервними копіями.

---

## 15. Відновлення PostgreSQL з резервної копії

## 15.1. Підготовка до відновлення

Перед відновленням бажано зупинити backend:

```bash
sudo systemctl stop diploma-backend
```

---

## 15.2. Відновлення зі звичайного `.sql`

```bash
psql -h localhost -U diploma_user -d diploma_db < /var/backups/diploma/db/diploma_db-<timestamp>.sql
```

---

## 15.3. Відновлення зі стисненого `.sql.gz`

```bash
gunzip -c /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz | psql -h localhost -U diploma_user -d diploma_db
```

---

## 15.4. Запуск backend після відновлення

```bash
sudo systemctl start diploma-backend
sudo systemctl status diploma-backend
```

Перевірка API:

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

---

## 16. Повне відновлення системи

Повне відновлення використовується після критичного збою, пошкодження коду або невдалого оновлення.

### Крок 1. Зупинка служб

```bash
sudo systemctl stop diploma-backend
sudo systemctl stop nginx
```

### Крок 2. Відновлення каталогу проєкту

```bash
sudo rm -rf /var/www/diploma
sudo tar -xzf /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz -C /
```

### Крок 3. Відновлення конфігурацій

```bash
sudo cp /var/backups/diploma/config/server.env-<timestamp>.bak /var/www/diploma/server/.env

sudo cp /var/backups/diploma/config/diploma.nginx-<timestamp>.bak /etc/nginx/sites-available/diploma

sudo cp /var/backups/diploma/config/diploma-backend-<timestamp>.service.bak /etc/systemd/system/diploma-backend.service
```

### Крок 4. Відновлення бази даних

```bash
gunzip -c /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz | psql -h localhost -U diploma_user -d diploma_db
```

Або для `.sql`:

```bash
psql -h localhost -U diploma_user -d diploma_db < /var/backups/diploma/db/diploma_db-<timestamp>.sql
```

### Крок 5. Оновлення systemd і перевірка Nginx

```bash
sudo systemctl daemon-reload
sudo nginx -t
```

### Крок 6. Запуск служб

```bash
sudo systemctl start nginx
sudo systemctl start diploma-backend
```

### Крок 7. Перевірка системи

```bash
sudo systemctl status nginx
sudo systemctl status diploma-backend
curl http://127.0.0.1:4000/api/health
```

Після цього потрібно вручну перевірити:

- відкриття сайту у браузері;
- реєстрацію і логін;
- створення твору;
- модерацію;
- коментарі;
- обране;
- прогрес читання;
- сторінку статистики.

---

## 17. Вибіркове відновлення

### 17.1. Відновлення тільки `.env`

```bash
sudo cp /var/backups/diploma/config/server.env-<timestamp>.bak /var/www/diploma/server/.env
sudo systemctl restart diploma-backend
```

### 17.2. Відновлення тільки конфігурації Nginx

```bash
sudo cp /var/backups/diploma/config/diploma.nginx-<timestamp>.bak /etc/nginx/sites-available/diploma
sudo nginx -t
sudo systemctl reload nginx
```

### 17.3. Відновлення тільки unit-файлу backend

```bash
sudo cp /var/backups/diploma/config/diploma-backend-<timestamp>.service.bak /etc/systemd/system/diploma-backend.service
sudo systemctl daemon-reload
sudo systemctl restart diploma-backend
```

### 17.4. Відновлення тільки бази даних

```bash
sudo systemctl stop diploma-backend

gunzip -c /var/backups/diploma/db/diploma_db-<timestamp>.sql.gz | psql -h localhost -U diploma_user -d diploma_db

sudo systemctl start diploma-backend
```

---

## 18. Тестування відновлення

Резервні копії мають сенс лише тоді, коли відновлення реально працює. Тому процедуру restore потрібно регулярно тестувати.

Рекомендовано:

- перевіряти відновлення PostgreSQL backup не рідше ніж раз на місяць;
- перевіряти повне відновлення на тестовому сервері не рідше ніж раз на квартал;
- після кожної зміни структури БД перевіряти, що backup і restore залишаються актуальними.

### Мінімальний сценарій тестування

1. створити тестову резервну копію PostgreSQL;
2. створити тестову базу даних;
3. відновити backup у тестову базу;
4. перевірити наявність таблиць;
5. перевірити кількість записів;
6. запустити backend з тестовою базою;
7. перевірити `/api/health`.

### Перевірка таблиць після restore

```sql
\dt

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM works;
SELECT COUNT(*) FROM comments;
```

---

## 19. Коротка покрокова схема резервного копіювання

1. перевірити вільне місце на диску;
2. створити або перевірити каталог `/var/backups/diploma`;
3. зробити backup PostgreSQL через `pg_dump`;
4. зробити копію `.env`;
5. зробити копію конфігурації Nginx;
6. зробити копію unit-файлу systemd;
7. створити архів усього каталогу `/var/www/diploma`;
8. зберегти логи backend і Nginx;
9. перевірити наявність і читабельність backup;
10. зберегти контрольні суми архівів;
11. за потреби виконати тестове відновлення.

---

## 20. Ознаки правильно організованого backup-процесу

Процес резервного копіювання організований правильно, якщо:

- backup-и створюються регулярно;
- backup-и містять PostgreSQL-дані, конфігурації та код;
- копії проходять перевірку цілісності;
- існує хоча б одна копія поза production-каталогом;
- діє політика ротації;
- restore-процедура перевіряється на практиці;
- після відновлення система повертається до працездатного стану;
- `/api/health` після restore повертає `database: true`.