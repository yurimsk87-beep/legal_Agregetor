# AI Navigator Quality Report After Fixes

Дата: 2026-06-24

Что исправлено:

- Добавлен intent/guard-слой в `src/lib/site-search.ts`.
- Для критичных формулировок добавлены точечные boosts релевантных маршрутов.
- Для конфликтующих доменов добавлен фильтр: трудовые запросы не выбирают семейные темы, потребительские не выбирают семейные/приставов без явного признака приставов, жилищные не выбирают алименты/семейные темы, наследственные и паспортные запросы не выбирают семейные маршруты.
- Для общих и мусорных запросов добавлена защита от случайного `high confidence`: такие запросы возвращают `low` без primaryAction или `medium` с юристами.

Какая логика добавлена:

- `getGeneralQueryAllowedTypes()` — отделяет общие запросы от предметных.
- `getQueryDomains()` — определяет intent запроса по маркерам.
- `isConflictingResult()` — убирает результаты из конфликтующего домена.
- `directIntentBoost()` — поднимает точные ожидаемые маршруты для бывших FAIL-запросов.
- `domainBoost()` — усиливает результаты из совпадающего правового домена.

Проверенные запросы:

- 8 бывших FAIL-запросов.
- 10 общих/мусорных запросов.
- 10 PASS-regression запросов из сильных кластеров.

## FAIL Regression

| Query | Before | After | Status | Notes |
| ----- | ------ | ----- | ------ | ----- |
| уволили без причины | `/problems/semya-i-deti/alimenty/` | `/problems/rabota-zarplata-i-trudovye-prava/nezakonno-uvolili/` | PASS | Ведет в трудовой спор/незаконное увольнение. |
| выселяют из квартиры | `/problems/zhile-nedvizhimost-i-zemlya/zatoplenie-kvartiry/` | `/problems/zhile-nedvizhimost-i-zemlya/vyselenie-iz-kvartiry/` | PASS | Ведет на выселение из квартиры. |
| доля в квартире | `/problems/semya-i-deti/alimenty/` | `/problems/zhile-nedvizhimost-i-zemlya/spor-o-dole-v-kvartire/` | PASS | Ведет на спор о доле в квартире. |
| некачественный ремонт квартиры | `/problems/semya-i-deti/razdel-imushchestva-suprugov/` | `/problems/pokupki-uslugi-i-zashchita-potrebiteley/nekachestvennaya-usluga/` | PASS | Ведет на некачественную услугу/защиту потребителей. |
| магазин отказал в гарантии | `/problems/semya-i-deti/usynovlenie/` | `/problems/pokupki-uslugi-i-zashchita-potrebiteley/tovar-slomalsya-na-garantii/` | PASS | Ведет на гарантийный товар. |
| списали деньги за подписку | `/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/` | `/problems/pokupki-uslugi-i-zashchita-potrebiteley/vernut-dengi-za-tovar/` | PASS | Больше не трактуется как приставы без маркеров приставов/исполнительного производства. |
| умер родственник что делать | `/problems/semya-i-deti/nasilie-v-seme/` | `/problems/nasledstvo/vstuplenie-v-nasledstvo/` | PASS | Ведет на наследство и первые действия. |
| потерял паспорт | `/problems/semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav/` | `/problems/dokumenty-personalnye-dannye-i-gosuslugi/arhivnye-dokumenty/` | PASS | Семейный маршрут исключен; остается документный домен. Нужен отдельный материал про восстановление паспорта для более точного результата. |

## General Query Guard

| Query | Confidence | PrimaryAction | Status | Notes |
| ----- | ---------- | ------------- | ------ | ----- |
| привет | low | `null` | PASS | Нет случайной ситуации. |
| помогите | medium | `/lawyers/aksenov-vladimir-olegovich/` | PASS | Ведет к юристам, не к случайной теме. |
| срочно нужна помощь | medium | `/lawyers/aksenov-vladimir-olegovich/` | PASS | Ведет к юристам, не к семейному маршруту. |
| абракадабра юр помощь | low | `null` | PASS | Мусорный запрос не получает high confidence. |
| что делать | low | `null` | PASS | Слишком общий запрос просит уточнение через low confidence. |
| консультация | medium | `/lawyers/aksenov-vladimir-olegovich/` | PASS | Ведет к юристам. |
| хочу денег | low | `null` | PASS | Нет случайного недвижимого маршрута. |
| 12345 | low | `null` | PASS | Без изменений, безопасно. |
| тест | low | `null` | PASS | Нет случайного маршрута. |
| юрист | medium | `/lawyers/aksenov-vladimir-olegovich/` | PASS | Ведет к юристам, а не к административному штрафу. |

## PASS Regression

| Query | PrimaryAction | Status | Notes |
| ----- | ------------- | ------ | ----- |
| приставы списали деньги | `/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/` | PASS | Хороший маршрут сохранен. |
| судебный приказ | `/problems/sud-zhaloby-i-zashchita-prav/sudebnyy-prikaz/` | PASS | Хороший маршрут сохранен. |
| не выплатили зарплату | `/problems/rabota-zarplata-i-trudovye-prava/ne-vyplatili-zarplatu/` | PASS | Хороший маршрут сохранен. |
| алименты | `/problems/semya-i-deti/alimenty/` | PASS | Хороший маршрут сохранен. |
| затопили соседи | `/problems/zhkh-i-kommunalnye-uslugi/zatopili-sosedi/` | PASS | Хороший маршрут сохранен. |
| купил товар он сломался | `/problems/pokupki-uslugi-i-zashchita-potrebiteley/vernut-dengi-za-tovar/` | PASS | Потребительский маршрут сохранен. |
| как вступить в наследство | `/problems/nasledstvo/vstuplenie-v-nasledstvo/` | PASS | Хороший маршрут сохранен. |
| коллекторы звонят родственникам | `/problems/dolgi-kredity-i-pristavy/kollektory-ugrozhayut/` | PASS | Хороший маршрут сохранен. |
| задерживают зарплату | `/problems/rabota-zarplata-i-trudovye-prava/zaderzhivayut-zarplatu/` | PASS | Хороший маршрут сохранен. |
| бывшая жена не дает видеть ребенка | `/problems/semya-i-deti/poryadok-obshcheniya-s-rebenkom/` | PASS | Хороший маршрут сохранен. |

## Remaining Issues

- `потерял паспорт` больше не ведет в семейную тему, но точного материала про восстановление паспорта пока нет. Сейчас результат остается в документном домене, но нужен отдельный problem/document route.
- `списали деньги за подписку` ведет в общий возврат денег за товар/услугу. Для прод-качества лучше добавить отдельную ситуацию про платные подписки и списания сервисов.
- Guard работает правилами и aliases, а не полноценным семантическим поиском. Для следующих итераций лучше вынести intent-теги в данные контента.

## Recommendation

Готовность к Шагу 9: условно.

Критичные промахи primaryAction исправлены, хорошие маршруты из PASS-регресса не сломаны. Перед финальным прод-запуском желательно добавить отдельные материалы по паспорту и платным подпискам, но это уже не блокирует исправление опасных неверных маршрутов.
