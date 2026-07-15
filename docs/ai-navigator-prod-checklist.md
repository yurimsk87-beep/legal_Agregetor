# AI Navigator Production Checklist

Карточка ИИ-навигатора управляется feature-флагами `AI_NAVIGATOR_ENABLED` и
`AI_NAVIGATOR_VISIBLE_TO`. Решение о видимости принимается на сервере
(`src/lib/ai/ai-navigator-visibility.ts`); backend `/api/ai-navigator/` остаётся
доступным независимо от флага.

## Перед деплоем

- [ ] Проверить миграции Prisma (`npx prisma migrate status`)
- [ ] Выполнить `npx prisma migrate deploy` (создаёт таблицу `AiNavigatorEvent`)
- [ ] Проверить `.env` на проде
- [ ] Установить `AI_NAVIGATOR_ENABLED=false` перед первым деплоем
- [ ] Установить `AI_NAVIGATOR_VISIBLE_TO=admin`
- [ ] Проверить `AI_NAVIGATOR_LLM_ENABLED`
- [ ] Если LLM включена, проверить `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`
- [ ] Не показывать API key в admin (показывается только «задан/не задан»)
- [ ] Проверить `/admin/ai-navigator/` (блок «Статус ИИ-навигатора»)
- [ ] Проверить `/search/?q=приставы%20списали%20деньги`
- [ ] Проверить `/search/?q=уволили%20без%20причины`
- [ ] Проверить главную
- [ ] Проверить fallback при LLM off
- [ ] Проверить события аналитики
- [ ] Проверить, что обычный поиск работает
- [ ] Проверить, что по «уволили без причины» не показывается «Исковое заявление о расторжении брака»

## Режимы запуска

### 1. Disabled

```
AI_NAVIGATOR_ENABLED=false
```

Ожидание:

- карточки нет на главной
- карточки нет на /search/
- обычный поиск работает
- admin-аналитика доступна

### 2. Admin-only

```
AI_NAVIGATOR_ENABLED=true
AI_NAVIGATOR_VISIBLE_TO=admin
```

Ожидание:

- admin видит карточку
- обычный пользователь не видит карточку
- неавторизованный пользователь не видит карточку
- обычный поиск работает

> Примечание: в режиме admin-only главная читает сессию (cookies), поэтому
> статическая ISR-генерация главной отключается (страница рендерится динамически).
> Это ожидаемо и временно; в режимах disabled и all главная остаётся статической.

### 3. All users

```
AI_NAVIGATOR_ENABLED=true
AI_NAVIGATOR_VISIBLE_TO=all
```

Ожидание:

- карточка видна всем
- аналитика пишет события
- fallback работает
- LLM ошибки не ломают сайт
- «уволили без причины» ведёт в трудовой спор
- «уволили без причины» не показывает документы про развод

## После запуска

- [ ] Проверить admin analytics через 1 час
- [ ] Проверить low confidence queries
- [ ] Проверить errors
- [ ] Проверить CTR primaryAction/result
- [ ] Проверить популярные запросы
- [ ] Проверить документы в выдаче по топовым запросам
- [ ] Если errors растут — выключить `AI_NAVIGATOR_ENABLED=false`
- [ ] Если low confidence много — собрать список для улучшения поиска
- [ ] Если появились нерелевантные documents — выключить показ documents или усилить guard

## Rollback

1. Поставить `AI_NAVIGATOR_ENABLED=false`
2. Перезапустить приложение
3. Проверить, что карточка исчезла (главная и /search/)
4. Убедиться, что обычный поиск остался рабочим
5. Backend `/api/ai-navigator/` можно не трогать — он безопасен и без флага

## Порядок прод-запуска (команды)

> Включение публичного режима `all` — только по отдельной команде владельца проекта.

### Этап 1. Первый деплой (Disabled — безопасный старт)

ENV:

```
AI_NAVIGATOR_ENABLED=false
AI_NAVIGATOR_VISIBLE_TO=admin
AI_NAVIGATOR_LLM_ENABLED=false
```

Команды:

```
npx prisma migrate deploy
npm run build
# restart app (pm2 restart <app> / systemctl restart <unit> — по инфраструктуре)
```

Проверки:

- сайт открывается;
- обычный поиск работает;
- карточки ИИ-навигатора нет (главная и /search/);
- `/admin/ai-navigator/` доступна admin, status-блок показывает `ENABLED=false`.

### Этап 2. Admin-only

ENV (меняем только эти, миграции/сборка уже на месте):

```
AI_NAVIGATOR_ENABLED=true
AI_NAVIGATOR_VISIBLE_TO=admin
```

```
# restart app
```

Проверки:

- admin видит карточку (главная и /search/);
- guest и обычный пользователь без роли ADMIN — не видят;
- аналитика пишет события (page=home/search);
- fallback работает (даже при LLM off);
- ошибок в логах нет.

### Этап 3. All users (только по подтверждению владельца)

ENV:

```
AI_NAVIGATOR_ENABLED=true
AI_NAVIGATOR_VISIBLE_TO=all
```

```
# restart app
```

Проверки:

- карточка видна всем (главная и /search/);
- мониторить `/admin/ai-navigator/`: errors, low confidence, CTR;
- при росте ошибок — немедленный rollback.

### Rollback (любой этап)

```
AI_NAVIGATOR_ENABLED=false
# restart app
```

## Результаты pre-deploy проверки

Дата: 2026-06-24. Локально, БД — Docker `legal_aggregator`.

- **migrate status:** PASS — «Database schema is up to date!», 19 миграций, drift нет, pending нет, миграция `ai_navigator_events` (`AiNavigatorEvent`) присутствует.
- **typecheck:** PASS — `tsc --noEmit` exit 0.
- **lint:** PARTIAL — `npm run lint` (eslint .) даёт 4 ошибки только в утилитах `scripts/dedupe-lawyer-names.js` и `scripts/generate-lawyer-bios.js` (`require()`-импорты) + 4 предсуществующих warning в `[slug]/page.tsx` и `layout.tsx`. Это вне области сборочного линта и не связано с ИИ-навигатором; все файлы навигатора линт проходят чисто.
- **build:** PASS — `npm run build` (`prisma generate && next build`) собрался полностью, таблица маршрутов выведена, ошибок server/client-импортов нет. Главная статическая в режиме disabled (куки не читаются).
- **disabled mode:** PASS — home 200; карточки нет на /search/; обычный поиск и подсказки работают; `/admin/ai-navigator/` для гостя → 307 (guard); status-блок: `enabled=false`, `apiKeyConfigured=false` (ключ не раскрывается).
- **admin-only mode:** PASS (с оговоркой) — guest не видит карточку (live); admin видит — подтверждено детерминированной матрицей `isAiNavigatorEnabledForViewer({role:"ADMIN"})=true`. Живая SSR-проверка под admin-сессией не выполнялась (куки админа в curl не выпускались).
- **all mode:** PASS — guest видит карточку (главная и /search/); аналитика пишет page=home/search; fallback при LLM off отдаёт детерминированный ответ; «уволили без причины» → трудовой спор, без документа про развод; «привет» → confidence low (нет случайного high); «магазин отказал в гарантии» → потребительский маршрут, без усыновления/семейного.
- **remaining blockers:** нет блокеров для запуска ИИ-навигатора. Несвязанный долг: `npm run lint` остаётся красным из-за `scripts/*.js` (стоит починить отдельной задачей, но деплою навигатора не мешает).
