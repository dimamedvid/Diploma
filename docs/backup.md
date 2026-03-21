# Резервне копіювання проєкту у production-середовищі

## 1. Призначення документа

Цей документ описує рекомендації для release engineer / DevOps щодо резервного копіювання та відновлення проєкту у production-середовищі.

Документ охоплює:

- стратегію резервного копіювання
- типи резервних копій
- частоту створення резервних копій
- правила зберігання та ротації
- процедуру резервного копіювання
- перевірку цілісності резервних копій
- автоматизацію процесу
- процедуру повного та вибіркового відновлення
- тестування відновлення

---

## 2. Загальні відомості

У поточній версії проєкту production-середовище складається з таких компонентів:

- **Nginx** як вебсервер і reverse proxy
- **frontend** як статична production-збірка React
- **backend** як Node.js / Express-застосунок
- **systemd** для керування backend-сервісом
- **JSON-файл** `server/data/users.json` як файлове сховище даних користувачів

Проєкт розгортається у каталозі:

```text
/var/www/diploma
```

У поточній реалізації окрема СУБД не використовується.  
Тому основним джерелом даних, яке потрібно резервувати, є файл:

```text
/var/www/diploma/server/data/users.json
```

Також до резервного копіювання потрібно включати:

- конфігурацію Nginx
- unit-файл systemd для backend
- production-збірку frontend або весь каталог проєкту
- логи системи, якщо вони потрібні для аудиту та діагностики

---

## 3. Стратегія резервного копіювання

Для цього проєкту рекомендовано використовувати комбіновану стратегію резервного копіювання:

- **щоденні резервні копії даних користувачів**
- **регулярні резервні копії конфігурацій**
- **періодичні повні резервні копії всього проєкту**
- **обов’язкові резервні копії перед кожним оновленням production-середовища**

Основна мета резервного копіювання:

- захистити дані користувачів від втрати
- забезпечити можливість швидкого відновлення після помилки оновлення
- зберегти робочі конфігурації сервера
- забезпечити відкат до попереднього стабільного стану

---

## 4. Типи резервних копій

### 4.1. Повна резервна копія

Повна резервна копія містить усі критично важливі компоненти системи:

- каталог проєкту `/var/www/diploma`
- файл `users.json`
- конфігурацію Nginx
- unit-файл systemd
- за потреби логи

Перевага повної копії полягає в тому, що вона дозволяє швидко відновити всю систему.

### 4.2. Інкрементальна резервна копія

Інкрементальна копія містить лише зміни з моменту останньої резервної копії.

Для цього проєкту інкрементальний підхід доцільний переважно для:

- логів
- архівів проєкту
- великих каталогів у разі подальшого розширення системи

### 4.3. Диференціальна резервна копія

Диференціальна копія містить зміни з моменту останньої повної резервної копії.

У поточному невеликому проєкті диференціальні копії можна застосовувати для:

- резервування каталогу проєкту між повними backup
- проміжного резервування конфігурацій

### 4.4. Практичне застосування у цьому проєкті

Оскільки проєкт невеликий, рекомендовано використовувати таку модель:

- **щодня** , резервна копія `users.json`
- **щотижня** , повна резервна копія всього каталогу `/var/www/diploma`
- **перед кожним production-оновленням** , окрема повна резервна копія даних і конфігурацій

---

## 5. Частота створення резервних копій

Рекомендована частота:

- **щодня** , резервна копія `users.json`
- **щотижня** , повний backup проєкту
- **перед кожним оновленням** , позаплановий backup
- **щомісяця** , архівна контрольна копія, яку зберігають довше за звичайні

Якщо частота змін у даних зросте, щоденний backup `users.json` можна замінити на резервування кожні 6 або 12 годин.

---

## 6. Зберігання та ротація копій

### 6.1. Каталог зберігання

Рекомендовано зберігати резервні копії у каталозі:

```text
/var/backups/diploma
```

### 6.2. Правила зберігання

У каталозі резервних копій бажано виділити окремі підкаталоги:

```text
/var/backups/diploma/data
/var/backups/diploma/config
/var/backups/diploma/project
/var/backups/diploma/logs
```

### 6.3. Ротація

Рекомендована схема ротації:

- щоденні копії зберігати **7 днів**
- щотижневі копії зберігати **4 тижні**
- щомісячні копії зберігати **3–6 місяців**

Приклад логіки:

- останні 7 щоденних backup
- останні 4 щотижневі backup
- останні 3 щомісячні backup

### 6.4. Додаткові рекомендації

Для підвищення надійності бажано:

- зберігати принаймні одну копію поза основним сервером
- не зберігати єдиний backup на тому ж диску, де працює production
- обмежити доступ до резервних копій тільки адміністраторам

---

## 7. Процедура резервного копіювання

## 7.1. Підготовка

Перед створенням backup потрібно:

1. перевірити наявність місця на диску
2. переконатися, що каталог `/var/backups/diploma` існує
3. перевірити права доступу до критичних файлів
4. визначити, які саме дані треба резервувати у поточний момент

### Перевірка вільного місця

```bash
df -h
```

### Створення каталогу резервних копій

```bash
sudo mkdir -p /var/backups/diploma/data
sudo mkdir -p /var/backups/diploma/config
sudo mkdir -p /var/backups/diploma/project
sudo mkdir -p /var/backups/diploma/logs
```

---

## 7.2. Резервне копіювання бази даних / даних

У поточній версії окрема база даних відсутня.  
Замість неї використовується файлове сховище `users.json`.

### Резервна копія користувацьких даних

```bash
sudo cp /var/www/diploma/server/data/users.json /var/backups/diploma/data/users.json.bak
```

Для іменування з часовою позначкою:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)
sudo cp /var/www/diploma/server/data/users.json /var/backups/diploma/data/users-$TIMESTAMP.json.bak
```

---

## 7.3. Резервне копіювання конфігурацій

### Конфігурація Nginx

```bash
sudo cp /etc/nginx/sites-available/diploma /var/backups/diploma/config/diploma.nginx.bak
```

### Unit-файл systemd

```bash
sudo cp /etc/systemd/system/diploma-backend.service /var/backups/diploma/config/diploma-backend.service.bak
```

---

## 7.4. Резервне копіювання всього проєкту

Повна копія каталогу проєкту:

```bash
TIMESTAMP=$(date +%F-%H-%M-%S)
sudo tar -czf /var/backups/diploma/project/diploma-project-$TIMESTAMP.tar.gz /var/www/diploma
```

---

## 7.5. Резервне копіювання логів системи

Для діагностики корисно зберігати частину логів backend і Nginx.

### Логи backend через journalctl

```bash
sudo journalctl -u diploma-backend -n 500 --no-pager > /var/backups/diploma/logs/diploma-backend.log
```

### Логи Nginx

```bash
sudo cp /var/log/nginx/access.log /var/backups/diploma/logs/nginx-access.log
sudo cp /var/log/nginx/error.log /var/backups/diploma/logs/nginx-error.log
```

---

## 8. Перевірка цілісності резервних копій

Після створення резервних копій потрібно перевірити:

- чи файл або архів реально створився
- чи його розмір не дорівнює нулю
- чи архів можна прочитати
- чи резервна копія містить очікувані файли

### Перевірка списку резервних копій

```bash
ls -lh /var/backups/diploma/data
ls -lh /var/backups/diploma/config
ls -lh /var/backups/diploma/project
ls -lh /var/backups/diploma/logs
```

### Перевірка архіву tar.gz

```bash
tar -tzf /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz
```

### Обчислення контрольної суми

```bash
sha256sum /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz
```

Контрольну суму бажано зберігати разом із архівом, щоб пізніше перевіряти цілісність.

---

## 9. Автоматизація процесу резервного копіювання

Для автоматизації резервного копіювання доцільно використовувати shell-скрипт і `cron`.

### 9.1. Приклад скрипта резервного копіювання

Нижче наведено приклад скрипта `scripts/backup-prod.sh`:

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/diploma"
BACKUP_ROOT="/var/backups/diploma"
TIMESTAMP="$(date +%F-%H-%M-%S)"

DATA_DIR="$BACKUP_ROOT/data"
CONFIG_DIR="$BACKUP_ROOT/config"
PROJECT_DIR="$BACKUP_ROOT/project"
LOG_DIR="$BACKUP_ROOT/logs"

mkdir -p "$DATA_DIR" "$CONFIG_DIR" "$PROJECT_DIR" "$LOG_DIR"

cp "$APP_DIR/server/data/users.json" "$DATA_DIR/users-$TIMESTAMP.json.bak"
cp /etc/nginx/sites-available/diploma "$CONFIG_DIR/diploma.nginx-$TIMESTAMP.bak"
cp /etc/systemd/system/diploma-backend.service "$CONFIG_DIR/diploma-backend-$TIMESTAMP.service.bak"

tar -czf "$PROJECT_DIR/diploma-project-$TIMESTAMP.tar.gz" "$APP_DIR"

journalctl -u diploma-backend -n 500 --no-pager > "$LOG_DIR/diploma-backend-$TIMESTAMP.log"

if [ -f /var/log/nginx/access.log ]; then
  cp /var/log/nginx/access.log "$LOG_DIR/nginx-access-$TIMESTAMP.log"
fi

if [ -f /var/log/nginx/error.log ]; then
  cp /var/log/nginx/error.log "$LOG_DIR/nginx-error-$TIMESTAMP.log"
fi

find "$DATA_DIR" -type f -mtime +7 -delete
find "$CONFIG_DIR" -type f -mtime +30 -delete
find "$PROJECT_DIR" -type f -mtime +30 -delete
find "$LOG_DIR" -type f -mtime +14 -delete

echo "Backup completed: $TIMESTAMP"
```

### 9.2. Права на виконання

```bash
chmod +x scripts/backup-prod.sh
```

### 9.3. Автоматичний запуск через cron

Приклад щоденного запуску о 02:30:

```bash
crontab -e
```

Додати рядок:

```cron
30 2 * * * /var/www/diploma/scripts/backup-prod.sh >> /var/log/diploma-backup.log 2>&1
```

---

## 10. Процедура відновлення з резервних копій

Відновлення залежить від того, що саме потрібно повернути:

- всю систему
- лише конфігурацію
- лише користувацькі дані
- лише окремі логи або архіви

---

## 11. Повне відновлення системи

Повне відновлення використовується після критичного збою, пошкодження коду або невдалого оновлення.

### Крок 1. Зупинка служб

```bash
sudo systemctl stop diploma-backend
sudo systemctl stop nginx
```

### Крок 2. Відновлення каталогу проєкту з архіву

```bash
sudo rm -rf /var/www/diploma
sudo tar -xzf /var/backups/diploma/project/diploma-project-<timestamp>.tar.gz -C /
```

### Крок 3. Відновлення даних користувачів

```bash
sudo cp /var/backups/diploma/data/users-<timestamp>.json.bak /var/www/diploma/server/data/users.json
```

### Крок 4. Відновлення конфігурації Nginx

```bash
sudo cp /var/backups/diploma/config/diploma.nginx-<timestamp>.bak /etc/nginx/sites-available/diploma
```

### Крок 5. Відновлення unit-файлу systemd

```bash
sudo cp /var/backups/diploma/config/diploma-backend-<timestamp>.service.bak /etc/systemd/system/diploma-backend.service
sudo systemctl daemon-reload
```

### Крок 6. Перевірка конфігурації Nginx

```bash
sudo nginx -t
```

### Крок 7. Запуск служб

```bash
sudo systemctl start nginx
sudo systemctl start diploma-backend
```

### Крок 8. Перевірка системи після відновлення

```bash
sudo systemctl status nginx
sudo systemctl status diploma-backend
```

Після цього потрібно вручну перевірити:

- відкриття сайту у браузері
- авторизацію і реєстрацію
- доступність API
- відсутність критичних помилок у логах

---

## 12. Вибіркове відновлення даних

Вибіркове відновлення використовується, коли потрібно повернути лише окрему частину системи.

### 12.1. Відновлення тільки `users.json`

```bash
sudo cp /var/backups/diploma/data/users-<timestamp>.json.bak /var/www/diploma/server/data/users.json
sudo chown www-data:www-data /var/www/diploma/server/data/users.json
```

### 12.2. Відновлення тільки конфігурації Nginx

```bash
sudo cp /var/backups/diploma/config/diploma.nginx-<timestamp>.bak /etc/nginx/sites-available/diploma
sudo nginx -t
sudo systemctl reload nginx
```

### 12.3. Відновлення тільки unit-файлу backend

```bash
sudo cp /var/backups/diploma/config/diploma-backend-<timestamp>.service.bak /etc/systemd/system/diploma-backend.service
sudo systemctl daemon-reload
sudo systemctl restart diploma-backend
```

---

## 13. Тестування відновлення

Резервні копії мають сенс лише тоді, коли відновлення реально працює.  
Тому процедуру restore потрібно регулярно тестувати.

Рекомендовано:

- перевіряти вибіркове відновлення `users.json` не рідше ніж раз на місяць
- перевіряти повне відновлення на тестовому сервері не рідше ніж раз на квартал
- після кожної зміни структури проєкту перевіряти, що backup і restore залишаються актуальними

### Мінімальний сценарій тестування

1. створити тестову резервну копію
2. змінити або пошкодити тестовий файл `users.json`
3. виконати відновлення з backup
4. перевірити, що backend читає файл без помилок
5. перевірити, що реєстрація та авторизація працюють коректно

### Ознаки успішного тесту restore

- потрібний файл або конфігурація успішно відновлені
- сервіси запускаються без помилок
- сайт відкривається
- критичні функції працюють
- у логах немає нових критичних помилок

---

## 14. Коротка покрокова схема резервного копіювання

1. перевірити вільне місце на диску
2. створити або перевірити каталог `/var/backups/diploma`
3. зробити копію `users.json`
4. зробити копію конфігурації Nginx
5. зробити копію unit-файлу systemd
6. створити архів усього каталогу `/var/www/diploma`
7. зберегти логи backend і Nginx
8. перевірити наявність і читабельність backup
9. зберегти контрольні суми архівів
10. за потреби виконати тестове відновлення

---

## 15. Ознаки правильно організованого backup-процесу

Процес резервного копіювання організований правильно, якщо:

- резервні копії створюються регулярно
- вони містять усі критичні дані і конфігурації
- копії проходять перевірку цілісності
- існує хоча б одна копія поза production-каталогом
- діє політика ротації
- restore-процедура перевіряється на практиці
- після відновлення система повертається до працездатного стану