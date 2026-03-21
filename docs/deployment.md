# Розгортання проєкту у production-середовищі

## 1. Призначення документа

Цей документ описує порядок розгортання інформаційної вебсистеми для створення, перегляду та оцінювання авторських літературних творів у production-середовищі.

Інструкція орієнтована на release engineer / DevOps-фахівця та охоплює:

- вимоги до апаратного забезпечення
- необхідне програмне забезпечення
- налаштування мережі
- конфігурацію серверів
- налаштування сховища даних
- розгортання коду
- перевірку працездатності після розгортання

---

## 2. Загальна схема production-розгортання

У production-середовищі проєкт доцільно розгортати за такою схемою:

- **Nginx** використовується як вебсервер і reverse proxy
- **frontend** збирається у production-build та роздається як статичний застосунок
- **backend** запускається як Node.js / Express-застосунок
- **systemd** використовується для керування backend-процесом
- дані користувачів зберігаються у локальному JSON-файлі `server/data/users.json`

### Основні компоненти production-архітектури

- **Web server**: Nginx
- **Application server**: Node.js + Express
- **СУБД**: окрема СУБД у поточній версії не використовується
- **Файлове сховище**: локальна файлова система сервера
- **Кешування**: не використовується
- **Інші компоненти**: systemd, npm, Git

---

## 3. Вимоги до апаратного забезпечення

### Підтримувана архітектура

Рекомендовано використовувати сервер з однією з таких архітектур:

- **x86_64 / amd64**
- **ARM64**, якщо всі потрібні пакети Node.js та Nginx підтримуються системою

### Мінімальні апаратні вимоги

Для невеликого production-розгортання достатньо:

- **CPU**: 2 vCPU
- **RAM**: 2 GB
- **Диск**: 20 GB SSD
- **Мережа**: стабільне підключення до інтернету з відкритими портами для HTTP/HTTPS

### Рекомендовані вимоги

Для стабільнішої роботи та запасу на зростання:

- **CPU**: 2–4 vCPU
- **RAM**: 4 GB
- **Диск**: 40 GB SSD
- **Резерв вільного місця**: не менше 10 GB для логів, збірок та резервних копій

---

## 4. Необхідне програмне забезпечення

Для production-розгортання на сервері потрібно встановити:

- **Ubuntu Server 22.04 LTS** або новішу сумісну версію
- **Git**
- **Node.js LTS**
- **npm**
- **Nginx**
- **systemd**
- за потреби **ufw** для базового керування мережевим доступом

### Приклад встановлення необхідного ПЗ

```bash
sudo apt update
sudo apt install -y git nginx curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### Перевірка встановлення

```bash
node -v
npm -v
git --version
nginx -v
```

---

## 5. Налаштування мережі

### Необхідні мережеві порти

Для коректної роботи production-середовища потрібно:

- відкрити порт **80** для HTTP
- відкрити порт **443** для HTTPS
- не відкривати зовні порт backend, якщо він працює лише через reverse proxy
- внутрішній backend-сервіс може працювати на `localhost:4000`

### Рекомендована мережева схема

- Nginx приймає зовнішні HTTP/HTTPS-запити
- frontend build віддається напряму через Nginx
- запити до API проксіюються з Nginx на backend
- backend слухає лише локальний інтерфейс або внутрішній порт сервера

### Приклад базового налаштування UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 6. Конфігурація серверів

## 6.1. Підготовка каталогу проєкту

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

---

## 6.2. Отримання коду з репозиторію

```bash
git clone https://github.com/dimamedvid/Diploma.git .
```

Якщо проєкт уже розгортався раніше:

```bash
git pull origin main
```

---

## 6.3. Встановлення залежностей

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

## 6.4. Збірка frontend

У production frontend повинен бути зібраний у статичний build:

```bash
cd /var/www/diploma/my-app
npm run build
```

Після цього з’явиться каталог:

```text
/var/www/diploma/my-app/build
```

---

## 6.5. Запуск backend/diploma/my-app/build
```

---

## 6.5. Запуск backend як systemd-сервісу

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
After=network.target

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

---

## 6.6. Конфігурація Nginx

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
        proxy_pass http://127.0.0.1:4000/;
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

Після цього Nginx буде:

- віддавати frontend як статичний сайт
- проксіювати API-запити на backend

---

## 7. Налаштування СУБД / сховища даних

У поточній версії проєкту окрема система керування базами даних не використовується.

Замість цього серверна частина працює з файловим JSON-сховищем:

```text
server/data/users.json
```

Тому для production потрібно:

- забезпечити наявність каталогу `server/data`
- забезпечити наявність файлу `users.json`
- надати backend-процесу права на читання і запис цього файлу
- врахувати цей файл у процедурі резервного копіювання

### Перевірка наявності сховища

```bash
mkdir -p /var/www/diploma/server/data
touch /var/www/diploma/server/data/users.json
```

### Початковий вміст файлу

```json
[]
```

### Налаштування прав доступу

Якщо backend працює від користувача `www-data`, потрібно надати йому права на запис:

```bash
sudo chown -R www-data:www-data /var/www/diploma/server/data
sudo chmod -R 750 /var/www/diploma/server/data
```

---

## 8. Розгортання коду у production

### Покрокова процедура першого розгортання

1. підготувати сервер і встановити необхідне ПЗ
2. створити каталог `/var/www/diploma`
3. склонувати репозиторій
4. встановити залежності для backend і frontend
5. виконати `npm run build` для frontend
6. створити та налаштувати `users.json`
7. створити `systemd`-сервіс для backend
8. створити конфігурацію Nginx
9. запустити backend
10. перевірити конфігурацію Nginx і перезапустити його
11. виконати перевірку працездатності

### Мінімальний набір команд для першого розгортання

```bash
sudo mkdir -p /var/www/diploma
sudo chown -R $USER:$USER /var/www/diploma
cd /var/www/diploma

git clone https://github.com/dimamedvid/Diploma.git .

cd server
npm install

mkdir -p data
touch data/users.json

cd ../my-app
npm install
npm run build
```

Після цього потрібно окремо налаштувати `systemd` та `nginx`.

---

## 9. Перевірка працездатності

Після завершення розгортання потрібно перевірити, що всі компоненти працюють коректно.

### 9.1. Перевірка backend-сервісу

```bash
sudo systemctl status diploma-backend
```

Сервіс повинен мати статус `active (running)`.

### 9.2. Перевірка доступності backend локально

```bash
curl http://127.0.0.1:4000
```

Якщо кореневий маршрут не використовується, можна перевірити один із наявних API-маршрутів, наприклад маршрут авторизації або документації API, якщо вона ввімкнена.

---

### 9.3. Перевірка Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
```

Nginx повинен пройти перевірку конфігурації без помилок і мати статус `active (running)`.

### 9.4. Перевірка frontend у браузері

Потрібно відкрити домен або IP-адресу сервера в браузері та перевірити:

- завантаження головної сторінки
- коректне відображення списку творів
- роботу маршрутизації між сторінками
- відкриття сторінок входу та реєстрації

### 9.5. Перевірка взаємодії frontend і backend

Потрібно перевірити:

- реєстрацію нового користувача
- вхід у систему
- доступ до захищених сторінок
- відсутність помилок у браузерній консолі
- відсутність помилок у логах backend

### 9.6. Перевірка логів

```bash
sudo journalctl -u diploma-backend -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

У логах не повинно бути критичних помилок, пов’язаних із запуском сервера, проксіюванням або доступом до `users.json`.

---

## 10. Ознаки успішного production-розгортання

Розгортання вважається успішним, якщо виконуються всі умови:

- Nginx запущений без помилок
- backend-сервіс працює через `systemd`
- frontend відкривається у браузері
- API-запити успішно проходять через reverse proxy
- реєстрація та авторизація користувачів працюють коректно
- файл `server/data/users.json` доступний для читання і запису
- у логах відсутні критичні помилки

---

## 11. Особливості поточної версії проєкту

Поточна production-схема є спрощеною, оскільки проєкт:

- не використовує окрему СУБД
- не має окремого кеш-сервісу
- не використовує контейнеризацію
- зберігає дані користувачів у локальному JSON-файлі

У майбутніх версіях доцільно розглянути:

- перехід на PostgreSQL або MySQL
- винесення конфігурації в `.env`
- використання PM2 або Docker Compose
- підключення HTTPS через Let’s Encrypt
- централізоване логування та моніторинг