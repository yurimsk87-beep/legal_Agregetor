# SEO_ACCEPTANCE_RULES.md

Статус: **канонические SEO-правила проекта ПравоПоиск**  
Официальные источники проверены: **2026-10-01**

Цель: органический рост за счёт полезных, технически доступных и юридически достоверных страниц. Документ не обещает индексацию или позиции.

## 1. Статусы и источники

- **MUST** - официальное требование или критическое правило проекта. Нарушение блокирует приёмку, если правило применимо.
- **SHOULD** - официальная рекомендация или сильная практика. Отклонение требует обоснования.
- **PROJECT** - внутренний стандарт ПравоПоиска, а не заявленный фактор ранжирования Google или Яндекса.
- **MUST** - приоритет источников: Google Search Central, Яндекс Вебмастер, Schema.org только для значения schema, затем PROJECT-правила.
- **MUST** - актуальная официальная документация имеет приоритет над этим файлом.
- **MUST** - для Q&A дополнительно действует `QNA_CONTENT_RULES.md`.

## 2. Gate индексации

`index=true` разрешён только при полном PASS:

- `technicalIndexability = PASS`;
- `userIntentValue = PASS`;
- `duplicateCanonical = PASS`;
- `legalTrust = PASS`;
- `privacy = PASS`;
- `pagePurpose = PASS`;
- `mobile = PASS`;
- `internalDiscovery = PASS`.

- **MUST** - `created`, `published` и `moderated` сами по себе не означают `indexable`.
- **MUST** - длина текста, keyword density, фиксированное число FAQ или ссылок, CTA, JSON-LD, `seoScore`, процент уникальности и `llms.txt` не являются hard gate или гарантией роста.

## 3. Пользовательская ценность и intent

- **MUST** - одна индексируемая страница решает один основной пользовательский intent и даёт самостоятельный результат.
- **MUST** - контент people-first: точный, понятный, полезный без поискового трафика и соответствующий фактической функции страницы.
- **MUST** - запрещены keyword stuffing, скрытый текст, текст ради объёма, AI-рерайт ради уникальности, страницы под каждый синоним и искусственное увеличение текста.
- **SHOULD** - содержание должно помогать завершить задачу без повторного поиска базовой информации.

## 4. Title, H1, description и URL

- **MUST** - `title` специфичен, описывает реальную страницу и intent, не переспамлен и не обещает отсутствующую функцию.
- **PROJECT** - у страницы один основной `H1`, согласованный с intent.
- **PROJECT** - slug понятен, стабилен и семантически соответствует `H1` и intent. Буквальное совпадение `H1` и slug не считается ranking factor.
- **SHOULD** - meta description специфична и полезна; обязательной фиксированной длины нет.
- **MUST** - разные URL не создаются только ради синонима, города, региона или увеличения числа страниц.

## 5. Юридическое доверие

- **MUST** - юридически значимые утверждения проходят актуальную проверку: конкретные статьи, части и пункты, применимая юрисдикция и доступные первичные источники.
- **MUST** - непроверенные нормы, сроки, суммы, пошлины, компетенция, подсудность или порядок подачи блокируют `legalTrust`.
- **SHOULD** - когда применимо, показываются reviewer, дата фактической юридической проверки, регион и официальные источники.
- **MUST** - `updatedAt` не считается датой юридической проверки без реального review.
- **MUST** - Q&A отражает спрос и язык пользователя, но не является источником права.

## 6. HTTP, robots и canonical

- **MUST** - существующая полноценная страница отвечает `200`; отсутствующая - `404`; удалённая без замены - `404/410`; постоянный перенос - `301`.
- **MUST** - soft 404 запрещён: пустая, ошибочная или отсутствующая сущность не должна отвечать как полноценная `200`-страница.
- **MUST** - для удаления из поиска используется доступный роботу `noindex`; `robots.txt Disallow` не заменяет `noindex`.
- **MUST** - основная версия имеет self-canonical; canonical согласован с redirect, sitemap и внутренними ссылками.
- **MUST** - canonical не заменяет самостоятельную ценность, оригинальность, privacy или legal review.

## 7. Sitemap, pagination и параметры

- **MUST** - sitemap содержит только canonical, indexable, HTTP 200 и PASS URL; исключает `noindex`, redirect, `404/410`, duplicate и технические query states.
- **MUST** - `lastmod` отражает только существенное изменение. `changefreq` и `priority` не выдаются за ranking factors Google.
- **MUST** - настоящая pagination использует отдельные URL, crawlable-ссылки и self-canonical. Универсальное правило `page > 1 => noindex` запрещено.
- **MUST** - filter, sort и query URL индексируются только при самостоятельном intent и ценности.
- **SHOULD** - для Яндекса применяйте `Clean-param`, когда параметр не меняет содержание и создаёт дубли.
- **PROJECT** - crawl-budget hacks вводятся только при подтверждённой проблеме в Search Console/Вебмастере, а не по условному порогу числа URL.

## 8. Programmatic SEO и doorway-защита

- **MUST** - комбинации `услуга x город`, `ситуация x город`, `тема x регион` не индексируются автоматически.
- **MUST** - подстановка города, региона, ключа или шаблонного абзаца без дополнительной пользы - FAIL.
- **MUST** - массово создаваемая страница обязана иметь самостоятельный intent, фактическую ценность и полный gate индексации.

## 9. Внутренние ссылки и обнаружение URL

- **MUST** - каждая важная indexable-страница имеет хотя бы одну crawlable внутреннюю ссылку `<a href="...">`; orphan page - FAIL.
- **SHOULD** - anchor описывает страницу назначения. Обязательного минимального количества ссылок нет.
- **PROJECT** - поддерживается полезный граф: `Q&A <-> ситуация <-> документ/инструмент <-> материал <-> профиль юриста`.
- **SHOULD** - после публикации проверьте внутреннюю ссылку, canonical, sitemap, правдивый `lastmod`, URL Inspection/Search Console и отправку в Яндекс через IndexNow.
- **MUST** - sitemap, URL Inspection и IndexNow ускоряют обнаружение, но не гарантируют crawl, индексирование или позицию.

## 10. Q&A и UGC

- **MUST** - перед `index=true` обязательны originality, semantic duplicate, privacy, legal и quality gates из `QNA_CONTENT_RULES.md`.
- **MUST** - `QAPage` применяется только к странице одного вопроса с видимыми ответами; блок похожих вопросов не делает другую страницу `QAPage`.
- **MUST** - `acceptedAnswer` размечает только реально принятый ответ.
- **SHOULD** - пользовательские ссылки получают `rel="ugc"`, а при необходимости `rel="ugc nofollow"`.

## 11. Structured data

- **MUST** - schema описывает реальные, видимые пользователю и применимые к типу страницы данные.
- **MUST** - запрещены фиктивные рейтинги, отзывы, авторы, юристы, офисы, credentials и иные сущности.
- **MUST** - JSON-LD не считается самостоятельным ranking factor, quality gate или SEO score.

## 12. Mobile-first и Core Web Vitals

- **MUST** - mobile crawler получает основной контент, ссылки, metadata и structured data без смысловых потерь.
- **SHOULD** - ориентир по field data на 75-м перцентиле: `LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1`.
- **SHOULD** - field data приоритетнее лабораторной; Lighthouse используется для диагностики, а не как гарантия ранжирования.

## 13. Приоритет роста и мониторинг

- **PROJECT** - до поисковых данных приоритет задают ясный intent, самостоятельная ценность, Q&A demand как сигнал проблемы и юридическая значимость. Q&A demand не равен search volume.
- **SHOULD** - после накопления данных приоритет задают фактические queries, impressions, clicks, CTR, average position, index status и crawl/index errors в Search Console и Яндекс Вебмастере.
- **MUST** - новые URL не создаются только ради увеличения количества страниц.

## 14. Automatic FAIL и PASS

**FAIL**, если найдено хотя бы одно: robots/noindex conflict; canonical conflict; неверный HTTP status или soft 404; semantic duplicate; thin/doorway programmatic page; устаревший юридический контент; Q&A без gates; sitemap содержит `noindex`, redirect, `404/410` или duplicate; schema не соответствует странице; фиктивные автор/юрист/организация; mobile теряет основной контент; важная страница orphaned.

**PASS** возможен только при полном gate из раздела 2 и отсутствии FAIL. PASS означает готовность к индексации, а не гарантию индексации, трафика или позиции.

## 15. Официальные источники

- Google: [Search Essentials](https://developers.google.com/search/docs/essentials), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [title links](https://developers.google.com/search/docs/appearance/title-link), [snippets](https://developers.google.com/search/docs/appearance/snippet).
- Google indexing: [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [robots/noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [recrawl/URL Inspection](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
- Google appearance: [structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [QAPage](https://developers.google.com/search/docs/appearance/structured-data/qapage), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), [mobile-first](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing).
- Яндекс: [SEO-тексты](https://yandex.ru/support/webmaster/ru/threat/seo-text), [малополезный контент](https://yandex.ru/support/webmaster/ru/threat/useless-content), [robots.txt](https://yandex.ru/support/webmaster/ru/controlling-robot/robots-txt), [Clean-param](https://yandex.ru/support/webmaster/ru/robot-workings/clean-param), [Sitemap](https://yandex.ru/support/webmaster/ru/controlling-robot/sitemap), [IndexNow](https://yandex.ru/support/webmaster/ru/indexing-options/index-now), [QAPage](https://yandex.ru/support/webmaster/ru/supported-schemas/q-and-a), [сайты и агрегаторы услуг](https://yandex.ru/support/webmaster/ru/search-results/site-services).
- Schema.org: [QAPage](https://schema.org/QAPage), [acceptedAnswer](https://schema.org/acceptedAnswer). Schema.org определяет словарь, но не гарантирует поисковое отображение или ранжирование.
