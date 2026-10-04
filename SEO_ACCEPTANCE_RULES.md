# SEO_ACCEPTANCE_RULES.md

Статус: **каноническая политика SEO-приёмки ПравоПоиска**
Официальные источники проверены: **2026-10-04**

Этот документ отвечает только на вопрос: **можно ли страницу безопасно и качественно отдавать в индекс**.

Стратегия выбора и приоритизации SEO-направлений описана в [SEO_GROWTH_STRATEGY.md](SEO_GROWTH_STRATEGY.md). Для Q&A дополнительно обязателен [QNA_CONTENT_RULES.md](QNA_CONTENT_RULES.md).

SEO acceptance = PASS означает готовность страницы к индексации. PASS не гарантирует обход, индексацию, показ, позицию, трафик или rich result.

---

## 1. Статусы правил

- **MUST** — критическое правило проекта или правило, нарушение которого создаёт реальную проблему индексируемости, качества, безопасности либо соответствия официальным рекомендациям. Нарушение применимого MUST даёт FAIL.
- **SHOULD** — официальная рекомендация или сильная практика, применяемая, когда релевантна. Отклонение должно иметь документированное основание.
- **PROJECT** — внутренний стандарт ПравоПоиска. PROJECT нельзя выдавать за ranking factor или требование Google/Яндекса.

Приоритет источников: актуальная документация Google Search Central → Яндекс Вебмастер → Schema.org только для смысла типов и свойств → внутренние правила ПравоПоиска. SEO-блоги, конкуренты и частные эксперименты не являются нормативными источниками.

---

## 2. Базовый acceptance gate

Страница может получить `index=true`, только если применимые проверки имеют PASS:

- `technicalIndexability`;
- `userIntentValue`;
- `duplicateCanonical`;
- `legalTrust`;
- `privacy`;
- `pagePurpose`;
- `mobile`;
- `internalDiscovery`.

**MUST:** любой FAIL блокирует `index=true`.

- `technicalIndexability` — правильный status, доступность crawler, render, robots/noindex и основной контент.
- `userIntentValue` — самостоятельный intent и полезный пользовательский результат.
- `duplicateCanonical` — нет неразрешённого семантического дубля; canonical-сигналы согласованы.
- `legalTrust` — юридически значимые утверждения актуальны и проверяемы.
- `privacy` — нет запрещённых персональных или приватных данных.
- `pagePurpose` — назначение страницы честное, не doorway и не поисковая ловушка.
- `mobile` — mobile crawler получает основной контент, ссылки и метаданные.
- `internalDiscovery` — есть настоящий crawlable путь с другой страницы.

`created`, `published` и `moderated` сами по себе не означают `indexable`.

---

## 3. People-first и основной intent

- **MUST:** одна indexable page имеет понятный основной пользовательский intent.
- **MUST:** страница решает задачу пользователя, а не заполняет SEO-порог.
- **MUST:** title, H1, описание, интерфейс и фактический результат не противоречат друг другу.
- **MUST:** массово созданная страница должна иметь самостоятельную ценность, а не только подстановку ключа, города или параметра.
- **SHOULD:** пользователь понимает применимый порядок, ограничения, риски и следующий шаг.

Запрещены:

- keyword stuffing, скрытый SEO-текст и запросный спам;
- AI-рерайт ради формальной уникальности;
- искусственное обновление даты;
- отдельные страницы под синонимы одного intent;
- массовые страницы без самостоятельной пользовательской ценности;
- обещание отсутствующей функции, документа или результата.

Не являются hard gates или самостоятельным основанием для PASS:

- фиксированный объём текста или keyword density;
- фиксированное число FAQ или внутренних ссылок;
- CTA;
- `seoScore`;
- JSON-LD ради score;
- процент текстовой уникальности сам по себе;
- буквальное совпадение H1, title и slug;
- `llms.txt`;
- искусственная свежесть.

---

## 4. Title, H1, description и slug

### Title

- **MUST:** соответствует основному intent и фактическому содержанию.
- **MUST:** не содержит keyword stuffing и не обещает отсутствующую функцию.
- **SHOULD:** специфичен для страницы и отличает её от других самостоятельных intents.

### Meta description

- **SHOULD:** специфична, полезна и честно описывает результат страницы.
- **MUST:** фиксированная длина не используется как SEO-gate.

### H1 и slug

- **PROJECT:** одна страница → один основной H1.
- **PROJECT:** H1 и slug семантически соответствуют странице и её intent.
- **MUST:** H1 не противоречит title и фактическому содержанию.
- **MUST:** буквальное совпадение H1 и slug не называется ranking factor.

---

## 5. Legal trust и privacy

Для юридически значимой страницы:

- **MUST:** новые и изменённые правовые утверждения опираются на проверенные правовые источники.
- **MUST:** юрисдикция и ограничения результата указаны, когда они влияют на вывод.
- **MUST:** юридически устаревший материал не выглядит актуально проверенным.
- **MUST:** `updatedAt` не подменяет дату фактической юридической проверки.
- **SHOULD:** пользователь видит реальные правовые основания, официальные источники, автора/reviewer и дату legal review, когда это применимо.
- **MUST:** нельзя создавать фиктивных авторов, юристов, reviewer, credentials, организаций, офисов, дат проверки, цен, рейтингов или отзывов.

Privacy gate:

- **MUST:** публичная индексируемая страница не раскрывает запрещённые персональные, аутентификационные, сессионные или приватные данные.
- **MUST:** маскирование в schema, snippet или CSS не заменяет удаление/защиту данных.
- **MUST:** Q&A проходит отдельные privacy-правила из `QNA_CONTENT_RULES.md`.

---

## 6. HTTP, robots и canonical

### HTTP status и redirects

- **MUST:** существующая полноценная страница → `200`.
- **MUST:** отсутствующая страница → `404`.
- **MUST:** окончательно удалённая без замены → `404` или `410`.
- **MUST:** постоянно перенесённая → `301` на релевантную замену.
- **MUST:** soft 404 → FAIL.
- **MUST:** redirect chain, loop и нерелевантный mass redirect устраняются.

### Robots и noindex

- **MUST:** indexable page доступна crawler и не имеет конфликтующего `noindex`.
- **MUST:** нельзя рассчитывать, что crawler прочитает `noindex` внутри URL, заблокированного `robots.txt`.
- **MUST:** приватный или служебный URL защищается на уровне доступа, а не только robots/noindex.

### Canonical

- **MUST:** основная indexable page имеет согласованный canonical.
- **MUST:** canonical согласован с internal links, sitemap, redirects и index state.
- **MUST:** canonical не указывает на `noindex`, redirect, `404/410` или нерелевантную страницу.
- **MUST:** canonical не заменяет самостоятельную ценность и не исправляет thin/doorway content.

---

## 7. Sitemap, lastmod и обнаружение URL

- **MUST:** sitemap содержит только canonical indexable `200` URLs.
- **MUST:** в sitemap не входят `noindex`, redirects, `404/410`, неразрешённые дубли и технические query states.
- **MUST:** `lastmod` отражает реальное существенное изменение.
- **MUST:** `changefreq` и `priority` не выдаются за ranking factors Google.

После публикации важной indexable page:

- **MUST:** существует crawlable внутренняя ссылка с `href`;
- **MUST:** canonical корректен;
- **MUST:** URL находится в подходящем sitemap;
- **SHOULD:** Google Search Console / URL Inspection используется при необходимости;
- **SHOULD:** IndexNow используется для поддерживаемых Яндексом сценариев;
- **SHOULD:** фактический crawl/index status отслеживается.

Sitemap, URL Inspection и IndexNow ускоряют обнаружение или диагностику, но не гарантируют индексацию.

---

## 8. Pagination, parameters и programmatic pages

- **MUST:** настоящая pagination не получает универсальное `page > 1 → noindex`.
- **MUST:** последовательность страниц использует crawlable links; indexable pagination page имеет self-canonical.
- **MUST:** filters, sort, session и технические parameters не становятся indexable автоматически.
- **SHOULD:** дублирующие параметры консолидируются canonical, redirects, internal linking и, где применимо для Яндекса, `Clean-param`.
- **MUST:** programmatic URL не запрещён как класс, но проходит обычный acceptance.
- **MUST:** programmatic page с самостоятельным intent и дополнительной ценностью может индексироваться.
- **MUST:** страница, отличающаяся в основном подстановкой города, ключа или параметра без самостоятельной пользы, получает FAIL.

---

## 9. Internal linking

- **MUST:** каждая важная indexable page имеет хотя бы одну настоящую crawlable ссылку с другой страницы.
- **MUST:** ссылка использует обычный `href`; anchor описывает destination.
- **MUST:** важная indexable page не должна быть orphaned.
- **SHOULD:** связь добавляется только когда полезна пользователю.
- **PROJECT:** допустимые смысловые связи: категория → ситуация → scenario → документ/инструмент → Q&A/материал → профиль юриста.
- **MUST:** фиксированный минимум внутренних ссылок не вводится.

---

## 10. Q&A и UGC

Для Q&A одновременно обязательны `QNA_CONTENT_RULES.md` и этот документ.

- **MUST:** `created`, `published` или `moderated` не означают автоматический index.
- **MUST:** index требует применимых originality, semantic duplicate, privacy, legal, quality и page-purpose gates.
- **MUST:** каждый вопрос не индексируется автоматически.
- **MUST:** Q&A не является источником права.
- **MUST:** импортированный или слегка переписанный Q&A не получает index автоматически.
- **MUST:** недоверенный UGC не публикуется в index до прохождения gates.
- **SHOULD:** внешние пользовательские ссылки получают `rel="ugc"` или `rel="ugc nofollow"`.

`QAPage` допустим только когда страница действительно посвящена одному вопросу и пользовательским ответам, а размеченные данные видимы. Блок «Похожие вопросы» на ситуации, документе или материале не превращает страницу в `QAPage`. `acceptedAnswer` допустим только для реально принятого ответа.

---

## 11. Structured data

Schema используется только если:

- **MUST:** тип применим к фактической странице;
- **MUST:** данные реальны, видимы пользователю и совпадают с основным содержимым;
- **MUST:** сущности и связи существуют в продукте;
- **MUST:** обязательные свойства конкретного типа заполнены правдивыми данными.

Запрещены fake reviews, ratings, authors, lawyers, credentials, offices, organizations, prices и `LocalBusiness` без реального бизнеса. `ProfilePage` применяется только когда основной предмет страницы — реальный человек или организация, связанная с сайтом.

JSON-LD не является самостоятельным ranking factor, SEO score или гарантией rich result. Schema.org определяет словарь, но не доказывает поддержку поисковой функцией.

---

## 12. Mobile и производительность

- **MUST:** mobile crawler получает основной контент, crawlable links, canonical, robots metadata и structured data.
- **MUST:** основной индексируемый результат не зависит от действия, недоступного crawler.
- **MUST:** mobile-версия, теряющая основной контент, получает FAIL.
- **SHOULD:** ориентиры хороших Core Web Vitals по field data на 75-м перцентиле: `LCP ≤ 2.5 s`, `INP < 200 ms`, `CLS < 0.1`.
- **PROJECT:** Lighthouse/PageSpeed используются для диагностики.
- **PROJECT:** PageSpeed 90+ может быть инженерной целью, но не SEO-gate и не гарантией позиции.

---

## 13. Automatic FAIL

SEO acceptance получает FAIL при любом применимом условии:

- robots/noindex conflict;
- canonical conflict;
- неправильный HTTP status, redirect loop или soft 404;
- unresolved semantic duplicate;
- thin/doorway programmatic page;
- юридически устаревший контент, представленный как актуальный;
- юридическое утверждение без обязательной проверки;
- privacy gate не пройден;
- Q&A не прошёл обязательные gates;
- sitemap содержит `noindex`, redirect, `404/410` или duplicate;
- structured data не соответствует видимой странице;
- fake author/lawyer/reviewer/business/office/rating/review/price;
- mobile теряет основной контент;
- важная indexable page orphaned;
- страница создана только под синоним, город, параметр или ключ без самостоятельной ценности;
- index разрешён только по внутреннему score или количественному порогу;
- страница обещает отсутствующую функцию или результат.

---

## 14. SEO acceptance PASS

PASS выдаётся только если:

- восемь применимых gates из раздела 2 имеют PASS;
- Automatic FAIL отсутствуют;
- применимые MUST выполнены;
- отклонения от SHOULD документированы;
- PROJECT-правила не названы требованиями или ranking factors поисковых систем.

PASS означает только готовность к индексации.

---

## 15. Официальные источники

Дата проверки ссылок: **2026-10-04**.

### Google Search Central

- [Search Essentials](https://developers.google.com/search/docs/essentials)
- [Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Title links](https://developers.google.com/search/docs/appearance/title-link)
- [Snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Robots and noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [QAPage](https://developers.google.com/search/docs/appearance/structured-data/qapage)
- [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)
- [Recrawl and URL Inspection](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)

### Яндекс Вебмастер

- [SEO-тексты](https://yandex.ru/support/webmaster/ru/threat/seo-text)
- [Малополезный контент](https://yandex.ru/support/webmaster/ru/threat/useless-content)
- [robots.txt](https://yandex.ru/support/webmaster/ru/controlling-robot/robots-txt)
- [Clean-param](https://yandex.ru/support/webmaster/ru/robot-workings/clean-param)
- [Sitemap](https://yandex.ru/support/webmaster/ru/controlling-robot/sitemap)
- [IndexNow](https://yandex.ru/support/webmaster/ru/indexing-options/index-now)
- [Q&A markup](https://yandex.ru/support/webmaster/ru/supported-schemas/q-and-a)
- [Сайт и агрегатор услуг](https://yandex.ru/support/webmaster/ru/search-results/site-services)

### Schema.org

- [QAPage](https://schema.org/QAPage)
- [ProfilePage](https://schema.org/ProfilePage)
- [acceptedAnswer](https://schema.org/acceptedAnswer)

Schema.org определяет словарь данных, но не гарантирует поисковое представление или рост позиции.
