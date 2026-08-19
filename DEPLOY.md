# Деплой на VPS: Node.js 20 + PM2 + Nginx (FastPanel)

Стек: Next.js 15 (App Router) + Prisma + PostgreSQL. Приложение работает как Node-процесс
на `127.0.0.1:3000` под PM2, а Nginx (через FastPanel) проксирует на него публичный домен и держит SSL.

---

## 0. Предусловия

- VPS на Ubuntu/Debian с FastPanel.
- Домен `pravopoisk.ru` с A-записью на IP сервера (и `www`, если нужен).
- ≥ 2 ГБ RAM (для `next build`; если меньше — добавьте swap).
- Доступ по SSH (root/sudo).

---

## 1. Node.js 20 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v   # ожидаем v20.x
```

---

## 2. PostgreSQL: база и пользователь

PostgreSQL можно поставить через FastPanel или вручную:

```bash
sudo apt install -y postgresql
sudo -u postgres psql <<'SQL'
CREATE USER legal_user WITH PASSWORD 'CHANGE_ME_db_password';
CREATE DATABASE legal_aggregator OWNER legal_user;
GRANT ALL PRIVILEGES ON DATABASE legal_aggregator TO legal_user;
SQL
```

---

## 3. Код проекта на сервере

Поместите проект, например, в `/var/www/legal-aggregator` (через git clone или scp/rsync,
**без** `node_modules` и `.next` — они соберутся на сервере).

```bash
cd /var/www/legal-aggregator
npm ci
```

> `postinstall`/`build` сами вызовут `prisma generate`, отдельная команда не нужна.

---

## 4. Переменные окружения

Скопируйте шаблон в **`.env`** (именно `.env` — его читают и Next.js, и Prisma CLI):

```bash
cp .env.production.example .env
# сгенерируйте секреты:
openssl rand -base64 48   # → JWT_SECRET
openssl rand -base64 48   # → AUTH_SECRET
openssl rand -base64 32   # → BOT_VISIT_SECRET
nano .env
```

Обязательно заполнить: `DATABASE_URL` (с реальным паролем), `JWT_SECRET`, `AUTH_SECRET`,
`ADMIN_PASSWORD`. `SITE_URL`/`NEXT_PUBLIC_SITE_URL` уже стоят на `https://pravopoisk.ru`.

Создайте закрытый каталог для PDF, передаваемых юристу. Он не должен находиться внутри `public`:

```bash
sudo install -d -m 700 -o pravopoisk -g pravopoisk /var/lib/pravopoisk/lead-attachments
```

Замените `pravopoisk` на системного пользователя PM2, если приложение запущено от другого пользователя. Для гарантированного удаления файлов старше 30 дней добавьте ежедневное задание root в `/etc/cron.d/pravopoisk-attachments`:

```cron
17 3 * * * root find /var/lib/pravopoisk/lead-attachments -type f -name '*.pdf' -mmin +43200 -delete
```

В Docker Compose закрытое хранилище и ежедневная очистка уже настроены именованным volume и сервисом `attachment-cleaner`.

> ⚠️ `NEXT_PUBLIC_*` зашиваются на этапе **build**, поэтому `.env` должен существовать **до** шага 6.

---

## 5. База данных: схема + данные

Выберите один путь.

**A. Чистый старт (только админ, без контента):**
```bash
npx prisma migrate deploy     # создаёт схему по миграциям
npm run prisma:seed           # создаёт администратора (в production без demo-контента)
```

**B. Перенести текущие данные (рекомендуется — переносит существующие Q&A и юристов):**
Полный дамп уже содержит схему и историю миграций, поэтому `migrate deploy` запускать **не нужно**.

На **локальной машине** (где текущая БД работает в Docker):
```bash
docker compose exec postgres pg_dump -U postgres -d legal_aggregator --no-owner --no-privileges -f /tmp/db.sql
docker compose cp postgres:/tmp/db.sql ./pravopoisk-db.sql
scp pravopoisk-db.sql root@SERVER_IP:/var/www/legal-aggregator/
```
На **VPS** восстановить в пустую базу:
```bash
psql "postgresql://legal_user:PASS@localhost:5432/legal_aggregator?schema=public" < pravopoisk-db.sql
```
После переноса смените пароль администратора, если в дампе остался dev-пароль.

---

## 6. Сборка

```bash
npm run build
```

---

## 7. Запуск под PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup            # выполните команду, которую выведет PM2 (автозапуск после ребута)
pm2 status
```

Проверка, что Node-сервер отвечает на loopback:

```bash
curl -I http://127.0.0.1:3000        # ожидаем HTTP/1.1 200 OK
```

---

## 8. Nginx reverse proxy (FastPanel)

В FastPanel создайте сайт для `pravopoisk.ru`, включите бесплатный SSL (Let's Encrypt),
затем добавьте проксирование на Node-приложение. Если правите конфиг Nginx сайта вручную,
используйте такой `location`:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    client_max_body_size 12m;   # запас под вложения к вопросам (до 10 МБ)
}
```

После сохранения конфигурации:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Откройте `https://pravopoisk.ru` — сайт должен отвечать через Nginx + SSL.

---

## 9. Обновление (redeploy)

```bash
cd /var/www/legal-aggregator
git pull                      # или залейте новые файлы
npm ci
npx prisma migrate deploy     # если появились новые миграции
npm run build
pm2 reload legal-aggregator   # рестарт без даунтайма
```

---

## 10. После запуска

- В FastPanel убедитесь, что SSL выпущен и работает редирект http → https.
- Заполните `GOOGLE_SITE_VERIFICATION` / `YANDEX_VERIFICATION` в `.env`, затем `npm run build` + `pm2 reload`.
- Подключите Google Search Console и Яндекс.Вебмастер, загрузите `/sitemap.xml`.
- Смените пароль администратора, если переносили дамп с dev-паролем.
- Настройте бэкап БД (`pg_dump` по cron) и логов PM2 (`pm2 logs legal-aggregator`).

---

## Поисковики: сайт открыт, закрыты только страницы вопросов

Весь сайт индексируется по обычной логике. В `.env` стоит `BLOCK_QUESTIONS_INDEXING=true`,
поэтому из индекса исключены **только отдельные страницы вопросов**:
- `/questions/<slug>` отдают `X-Robots-Tag: noindex, follow` — бот не индексирует сами вопросы,
  но проходит по ссылкам на юристов и услуги;
- хаб `/questions/` (лендинг) и остальной сайт открыты; `robots.txt` обычный (без `Disallow: /`).

Проверка после деплоя:
```bash
curl -sI https://pravopoisk.ru/questions/                | grep -i x-robots  # пусто (хаб открыт)
curl -sI https://pravopoisk.ru/questions/primer-voprosa/ | grep -i x-robots  # ожидаем: noindex, follow
curl -sI https://pravopoisk.ru/                          | grep -i x-robots  # пусто (главная открыта)
```

**Открыть раздел вопросов, когда контент готов:** в `.env` поставьте `BLOCK_QUESTIONS_INDEXING=false`,
затем пересоберите и перезапустите:
```bash
npm run build && pm2 reload legal-aggregator
```
> Флаг читается на этапе **сборки**, поэтому одного рестарта без `build` недостаточно.

---

## Полезные команды

```bash
pm2 logs legal-aggregator      # логи приложения
pm2 restart legal-aggregator   # полный рестарт
pm2 reload legal-aggregator    # рестарт без даунтайма
pm2 monit                      # мониторинг
```

