# ПравоПоиск MVP

Юридический навигатор для граждан: определяем ситуацию, показываем сроки и риски, помогаем подготовить документы и подключаем юриста, если без него нельзя.

Проект построен на Next.js App Router, TypeScript, Prisma, PostgreSQL и Tailwind CSS. Основные публичные разделы:

- `/` — главная страница навигатора;
- `/check/` — MVP-диагностика ситуации;
- `/problems/` — правовой навигатор и жизненные ситуации;
- `/documents/` — документы и генераторы;
- `/tools/` — инструменты;
- `/questions/` — Q&A после модерации;
- `/lawyers/` — профили юристов;
- `/about/`, `/contacts/`, `/legal/*` — служебные и правовые страницы.

## Требования

- Node.js 22+;
- npm;
- Docker и Docker Compose;
- PostgreSQL 16;
- Redis 7, если нужен docker-compose профиль с Redis. На текущем MVP Redis не является критичной runtime-зависимостью приложения.

## Установка

```bash
npm install
```

В PowerShell можно использовать:

```powershell
npm.cmd install
```

## Переменные окружения

Скопируйте пример:

```bash
cp .env.example .env
```

Минимум для локального запуска вне Docker:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/legal_aggregator?schema=public
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
JWT_SECRET=replace-with-strong-random-secret-at-least-32-chars
AUTH_SECRET=replace-with-strong-random-secret-at-least-32-chars
```

Для production обязательно задать реальные `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `JWT_SECRET`, `AUTH_SECRET`, `DATABASE_URL`. Публичные контакты платформы (`NEXT_PUBLIC_PLATFORM_EMAIL`, телефон, адрес, ИНН/ОГРН) оставляйте пустыми, если они не подтверждены.

## Docker, PostgreSQL и Redis

Поднять инфраструктуру:

```bash
docker compose up -d postgres redis
```

Запустить приложение в контейнере:

```bash
docker compose up --build app
```

PostgreSQL доступен на `localhost:5432`, Redis — на `localhost:6379`. Переменные приложения в `docker-compose.yml` синхронизированы с `.env.example`.

## Prisma

Сгенерировать клиент:

```bash
npm run prisma:generate
```

Применить миграции локально:

```bash
npm run prisma:migrate
```

Применить миграции на production/staging:

```bash
npm run prisma:deploy
```

Заполнить базу:

```bash
npm run prisma:seed
```

Seed в `production` не создает demo LAWYER-пользователей и sample-контент. В `development` и `test` demo-данные допустимы для локальной разработки.

## Dev-запуск

```bash
npm run dev
```

Откройте `http://localhost:3000`.

## Production build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Если build на Windows падает с `EPERM` на Prisma DLL, остановите локальный `next dev` процесс на порту 3000 и повторите build.

## Проверки перед запуском

```bash
npm run typecheck
npm run lint
npm run build
npm run seo:audit
```

Smoke URL:

- `/`
- `/check/`
- `/problems/`
- `/documents/`
- `/documents/vozrazhenie-na-sudebnyy-prikaz/generator/`
- `/tools/`
- `/tools/sudebnyy-prikaz-deadline/`
- `/questions/`
- `/lawyers/`
- `/about/`
- `/contacts/`
- `/legal/privacy/`
- `/sitemap.xml`
- `/robots.txt`

Legacy redirect smoke:

- `/blog/` → `/problems/`
- `/services/` → `/problems/`
- `/calculators/` → `/tools/`
- `/cases/` → `/problems/`
- `/cities/` → `/lawyers/`
- `/privacy/` → `/legal/privacy/`
- `/terms/` → `/legal/terms/`
- `/contact/` → `/contacts/`

## SEO и индексация

- Canonical формируется через `buildMetadata`.
- Sitemap index: `/sitemap.xml`.
- Дочерние sitemap: pages, problems, documents, tools, lawyers, questions.
- `robots.txt` закрывает `/admin`, `/api`, кабинет юриста, login/logout, private uploads, search, test/fallback/debug и query-фильтры.
- Q&A индексируется только после модерации и quality gate.
- В production repository fallback для sample data возвращает пустые значения, чтобы не показывать demo-данные как реальные.

## Документы и генераторы

Генераторы работают на клиенте и не отправляют введенные данные на сервер, пока пользователь отдельно не передает их через другую форму. Сформированный документ является шаблоном и не заменяет индивидуальную юридическую консультацию.

## Storage

Локальный режим:

```env
STORAGE_DRIVER=local
MAX_UPLOAD_SIZE_MB=10
```

Файлы сохраняются в `public/uploads/`.

S3-compatible режим:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
```

Загрузка выполняется сервером. S3-ключи не попадают в браузер.

## Правовые и служебные страницы

Канонические legal URL:

- `/legal/privacy/`
- `/legal/terms/`
- `/legal/personal-data-consent/`
- `/legal/disclaimer/`
- `/legal/qna-rules/`
- `/legal/lawyer-rules/`

Старые legal URL редиректят на эти страницы через middleware и route-level redirects.
