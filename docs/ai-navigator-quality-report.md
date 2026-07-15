# AI Navigator Quality Report

Дата: 2026-06-24
Среда тестирования: local dev server `http://localhost:3000`, API `POST /api/ai-navigator/`
LLM режим: fallback/baseResponse на локальном dev. В текущем окружении AI env для LLM не задан; отдельная проверка helper показала корректный fallback при выключенной LLM и при недоступном endpoint.
Количество запросов: 70
PASS: 48
REVIEW: 14
FAIL: 8

## Общие выводы

ИИ-навигатор хорошо покрывает основные кластеры: приставы/долги/суд, зарплата, семья/дети и большая часть наследства. UI на главной и на /search/ работает, уточнения не меняют deterministic-поля, аналитика пишет события с разделением `page=home/search`.

Главный риск перед продом - качество ранжирования/primaryAction для части неоднозначных и недостаточно покрытых запросов. Есть критичные промахи, где high confidence ведет в другую правовую тему. До прод-запуска лучше поправить правила поиска/ранжирования или добавить защиту от high confidence при слабом совпадении.

Сводка по группам:

| Группа | PASS | REVIEW | FAIL |
| ------ | ---- | ------ | ---- |
| A. Приставы / долги / суд | 10 | 0 | 0 |
| B. Работа / зарплата | 9 | 0 | 1 |
| C. Семья / дети | 10 | 0 | 0 |
| D. Жилье / недвижимость | 6 | 1 | 3 |
| E. Потребители / покупки | 6 | 2 | 2 |
| F. Наследство / документы | 6 | 2 | 2 |
| G. Нерелевантные / плохие запросы | 1 | 9 | 0 |

Производительность API-прогона: median 1045 ms, p90 1161 ms, p95 1460 ms, max 1466 ms. Визуально dropdown подсказок не блокируется, карточка появляется после debounce, бесконечных запросов не замечено.

## Сводная таблица

| Query | Status | Confidence | Primary action | Sections | Notes |
| ----- | ------ | ---------- | -------------- | -------- | ----- |
| приставы списали деньги | PASS | high | /problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| списали деньги с карты | PASS | high | /problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/ | situations:2, instructions:2 | релевантный маршрут |
| арестовали карту | PASS | high | /problems/dolgi-kredity-i-pristavy/arestovali-zarplatnuyu-kartu/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| судебный приказ | PASS | high | /problems/sud-zhaloby-i-zashchita-prav/sudebnyy-prikaz/ | situations:2, instructions:2, documents:2, questions:2, lawyers:1 | релевантный маршрут |
| как отменить судебный приказ | PASS | high | /problems/sud-zhaloby-i-zashchita-prav/otmenit-sudebnyy-prikaz/ | situations:2, instructions:2, documents:1, questions:2 | релевантный маршрут |
| банк подал в суд | PASS | high | /problems/dolgi-kredity-i-pristavy/bank-podal-v-sud-po-kreditu/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| коллекторы звонят родственникам | PASS | high | /problems/dolgi-kredity-i-pristavy/kollektory-ugrozhayut/ | situations:2, instructions:2 | релевантный маршрут |
| не могу платить кредит | PASS | high | /problems/dolgi-kredity-i-pristavy/mfo-trebuet-vernut-dolg/ | situations:2, instructions:2 | релевантный маршрут |
| наложили арест на зарплатную карту | PASS | high | /problems/dolgi-kredity-i-pristavy/arestovali-zarplatnuyu-kartu/ | situations:2, instructions:2, documents:2, lawyers:1 | релевантный маршрут |
| удерживают всю зарплату | PASS | high | /problems/dolgi-kredity-i-pristavy/uderzhivayut-bolshe-polozhennogo/ | situations:2, instructions:2 | релевантный маршрут |
| не выплатили зарплату | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/ne-vyplatili-zarplatu/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| не выплатили расчет при увольнении | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/ne-vyplatili-zarplatu/ | situations:2, instructions:2, lawyers:2 | релевантный маршрут |
| уволили без причины | FAIL | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2 | primaryAction ведет на алименты вместо трудового спора |
| заставляют написать заявление по собственному | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/zastavlyayut-uvolitsya/ | situations:1, instructions:2, questions:1 | релевантный маршрут |
| не отдают трудовую книжку | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/ne-vydayut-trudovuyu-knizhku/ | situations:2, instructions:2, documents:2 | релевантный маршрут |
| работодатель не оформил официально | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/rabotali-bez-dogovora/ | situations:2, instructions:2 | релевантный маршрут |
| не оплатили больничный | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/ne-oplatili-bolnichnyy/ | situations:2, instructions:2 | релевантный маршрут |
| задерживают зарплату | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/zaderzhivayut-zarplatu/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| сократили без предупреждения | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/sokratili-bez-vyplat/ | situations:2, instructions:2, documents:1 | релевантный маршрут |
| работодатель требует вернуть деньги | PASS | high | /problems/rabota-zarplata-i-trudovye-prava/rabotodatel-trebuet-vernut-dengi/ | situations:2, instructions:2 | релевантный маршрут |
| алименты | PASS | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2, questions:2, lawyers:1 | релевантный маршрут |
| бывшая жена не дает видеть ребенка | PASS | high | /problems/semya-i-deti/poryadok-obshcheniya-s-rebenkom/ | situations:2, instructions:2, documents:2 | релевантный маршрут |
| как взыскать алименты | PASS | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| как уменьшить алименты | PASS | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| развод с детьми | PASS | high | /problems/semya-i-deti/razvod/ | situations:2, instructions:2, documents:1, questions:1, lawyers:2 | релевантный маршрут |
| раздел имущества при разводе | PASS | high | /problems/semya-i-deti/razdel-imushchestva-suprugov/ | situations:2, instructions:2, documents:1, questions:2, lawyers:2 | релевантный маршрут |
| определение места жительства ребенка | PASS | high | /problems/semya-i-deti/mesto-zhitelstva-rebenka/ | situations:2, instructions:2, documents:1, questions:2 | релевантный маршрут |
| лишение родительских прав | PASS | high | /problems/semya-i-deti/lishenie-roditelskih-prav/ | situations:2, instructions:2, documents:1, questions:2, lawyers:1 | релевантный маршрут |
| отец не платит алименты | PASS | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2, lawyers:1 | релевантный маршрут |
| брачный договор | PASS | high | /problems/semya-i-deti/brachnyy-dogovor/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| затопили соседи | PASS | high | /problems/zhkh-i-kommunalnye-uslugi/zatopili-sosedi/ | situations:2, instructions:2 | релевантный маршрут |
| соседи шумят | PASS | high | /problems/zhkh-i-kommunalnye-uslugi/shumnye-sosedi/ | situations:2, instructions:2 | релевантный маршрут |
| управляющая компания ничего не делает | PASS | high | /problems/zhkh-i-kommunalnye-uslugi/uk-ne-delaet-remont/ | situations:2, instructions:2, lawyers:1 | релевантный маршрут |
| протекает крыша | PASS | high | /problems/zhkh-i-kommunalnye-uslugi/protekaet-krysha/ | situations:1, instructions:1, questions:1 | релевантный маршрут |
| незаконная перепланировка | PASS | high | /problems/zhile-nedvizhimost-i-zemlya/nezakonnaya-pereplanirovka/ | situations:1, instructions:1 | релевантный маршрут |
| выселяют из квартиры | FAIL | high | /problems/zhile-nedvizhimost-i-zemlya/zatoplenie-kvartiry/ | situations:2, instructions:2, documents:1 | primaryAction ведет на затопление квартиры вместо выселения |
| доля в квартире | FAIL | high | /problems/semya-i-deti/alimenty/ | situations:2, instructions:2, questions:2 | primaryAction ведет на алименты вместо доли в квартире |
| как выписать человека из квартиры | PASS | high | /problems/zhile-nedvizhimost-i-zemlya/vyselenie-iz-kvartiry/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| спор с застройщиком | REVIEW | high | /problems/sud-zhaloby-i-zashchita-prav/apellyaciya/ | situations:2 | primaryAction ведет на апелляцию; нужны материалы по застройщику/ДДУ |
| некачественный ремонт квартиры | FAIL | high | /problems/semya-i-deti/razdel-imushchestva-suprugov/ | situations:2, instructions:2, documents:1 | primaryAction ведет на раздел имущества вместо ремонта/услуг |
| купил товар он сломался | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/vernut-dengi-za-tovar/ | situations:2, instructions:2, documents:1 | релевантный маршрут |
| отказали в возврате товара | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/obmanuli-pri-pokupke/ | situations:2, instructions:2, documents:1 | релевантный маршрут |
| не возвращают деньги за товар | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/vernut-dengi-za-tovar/ | situations:2, instructions:2 | релевантный маршрут |
| навязали страховку | REVIEW | high | /problems/medicina-i-zdorove/navyazali-platnoe-lechenie/ | situations:2, instructions:2 | primaryAction ведет на платное лечение; для страховки нужен отдельный маршрут |
| некачественная услуга | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/nekachestvennaya-usluga/ | situations:2, instructions:2 | релевантный маршрут |
| отменили рейс | REVIEW | medium | /questions/q-44976-pochemu-otmenili-rejsy-iz-za-rubezha/ | questions:1 | только Q&A, нет ситуации/инструкции по авиаперевозке |
| туроператор не возвращает деньги | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/turoperator-ne-vozvraschaet-dengi/ | situations:2, instructions:2 | релевантный маршрут |
| магазин отказал в гарантии | FAIL | high | /problems/semya-i-deti/usynovlenie/ | situations:2, instructions:2 | primaryAction ведет на усыновление вместо гарантии товара |
| заказ не доставили | PASS | high | /problems/pokupki-uslugi-i-zashchita-potrebiteley/ne-dostavili-oplachennyy-tovar/ | situations:1, instructions:1 | релевантный маршрут |
| списали деньги за подписку | FAIL | high | /problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/ | situations:1, instructions:2 | primaryAction ведет на приставов вместо потребительской подписки |
| как вступить в наследство | PASS | high | /problems/nasledstvo/vstuplenie-v-nasledstvo/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| пропустил срок наследства | REVIEW | high | /problems/nasledstvo/nasledstvo-s-dolgami/ | situations:2, instructions:2, documents:2 | primaryAction ведет на наследство с долгами; лучше отдельный маршрут восстановления срока |
| наследство без завещания | PASS | high | /problems/nasledstvo/nasledstvo-bez-zaveshchaniya/ | situations:2, instructions:2, questions:1 | релевантный маршрут |
| оспорить завещание | PASS | high | /problems/nasledstvo/osporit-zaveschanie/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| умер родственник что делать | FAIL | high | /problems/semya-i-deti/nasilie-v-seme/ | situations:2, instructions:2 | primaryAction ведет на насилие в семье вместо наследства/первых действий |
| нотариус отказал | PASS | high | /problems/nasledstvo/notarius-otkazal-v-nasledstve/ | situations:2, instructions:2, questions:2 | релевантный маршрут |
| восстановить документы | REVIEW | high | /problems/sud-zhaloby-i-zashchita-prav/vosstanovit-srok-v-sude/ | situations:2, instructions:2, questions:2 | primaryAction ведет на восстановление срока в суде; запрос про документы слишком общий |
| потерял паспорт | FAIL | high | /problems/semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav/ | situations:2, instructions:2, documents:1, questions:2 | primaryAction ведет на родительские права вместо паспорта |
| смена фамилии документы | PASS | high | /problems/semya-i-deti/brak-zags-i-smena-familii/ | situations:1, instructions:2 | релевантный маршрут |
| доверенность | PASS | high | /problems/dokumenty-personalnye-dannye-i-gosuslugi/doverennost/ | situations:1, instructions:1, documents:1, questions:2 | релевантный маршрут |
| привет | REVIEW | medium | /questions/q-26739-mozhet-li-moya-istoriya-poprivetstvovat-v-poluchenii-stud-vizy/ | questions:1 | общий приветственный запрос получил конкретный Q&A |
| помогите | REVIEW | medium | /questions/q-47794-kak-byt-pomogite-esli-kto-mozhet-ya-uveren-chto-lyudi-est-horoshie/ | questions:2 | слишком общий запрос получил конкретные Q&A |
| срочно нужна помощь | REVIEW | high | /problems/semya-i-deti/razdel-imushchestva-suprugov/ | situations:2, instructions:2, lawyers:2 | общий срочный запрос получил конкретный семейный маршрут |
| абракадабра юр помощь | REVIEW | high | /problems/medicina-i-zdorove/psihiatricheskaya-pomoshch/ | situations:1, instructions:2, lawyers:2 | мусорный запрос получил high confidence и медицинский маршрут |
| что делать | REVIEW | high | /problems/rabota-zarplata-i-trudovye-prava/diskriminaciya-na-rabote/ | situations:2 | слишком общий запрос получил high confidence и трудовой маршрут |
| консультация | REVIEW | medium | /questions/q-50729-kakaya-dolzhna-byt-dana-konsultaciya-po-voznikshim-voprosam/ | questions:2, lawyers:2 | общий запрос получил конкретные Q&A; лучше показывать юристов/уточнение |
| хочу денег | REVIEW | high | /problems/zhile-nedvizhimost-i-zemlya/rastorzhenie-dogovora-kupli-prodazhi/ | situations:2, instructions:2 | мусорный/общий запрос получил high confidence и недвижимость |
| 12345 | PASS | low | — | none | неуверенный/общий ответ без опасных обещаний |
| тест | REVIEW | medium | /problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/ | instructions:1, questions:2 | тестовый запрос получил конкретный маршрут |
| юрист | REVIEW | high | /problems/ugolovnye-i-administrativnye-riski/administrativnyy-shtraf/ | situations:2, questions:2, lawyers:2 | есть lawyers, но primaryAction ведет на административный штраф |

## Ошибки / REVIEW

- **FAIL**: уволили без причины — primaryAction ведет на алименты вместо трудового спора. Primary: `/problems/semya-i-deti/alimenty/`.
- **FAIL**: выселяют из квартиры — primaryAction ведет на затопление квартиры вместо выселения. Primary: `/problems/zhile-nedvizhimost-i-zemlya/zatoplenie-kvartiry/`.
- **FAIL**: доля в квартире — primaryAction ведет на алименты вместо доли в квартире. Primary: `/problems/semya-i-deti/alimenty/`.
- **REVIEW**: спор с застройщиком — primaryAction ведет на апелляцию; нужны материалы по застройщику/ДДУ. Primary: `/problems/sud-zhaloby-i-zashchita-prav/apellyaciya/`.
- **FAIL**: некачественный ремонт квартиры — primaryAction ведет на раздел имущества вместо ремонта/услуг. Primary: `/problems/semya-i-deti/razdel-imushchestva-suprugov/`.
- **REVIEW**: навязали страховку — primaryAction ведет на платное лечение; для страховки нужен отдельный маршрут. Primary: `/problems/medicina-i-zdorove/navyazali-platnoe-lechenie/`.
- **REVIEW**: отменили рейс — только Q&A, нет ситуации/инструкции по авиаперевозке. Primary: `/questions/q-44976-pochemu-otmenili-rejsy-iz-za-rubezha/`.
- **FAIL**: магазин отказал в гарантии — primaryAction ведет на усыновление вместо гарантии товара. Primary: `/problems/semya-i-deti/usynovlenie/`.
- **FAIL**: списали деньги за подписку — primaryAction ведет на приставов вместо потребительской подписки. Primary: `/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/`.
- **REVIEW**: пропустил срок наследства — primaryAction ведет на наследство с долгами; лучше отдельный маршрут восстановления срока. Primary: `/problems/nasledstvo/nasledstvo-s-dolgami/`.
- **FAIL**: умер родственник что делать — primaryAction ведет на насилие в семье вместо наследства/первых действий. Primary: `/problems/semya-i-deti/nasilie-v-seme/`.
- **REVIEW**: восстановить документы — primaryAction ведет на восстановление срока в суде; запрос про документы слишком общий. Primary: `/problems/sud-zhaloby-i-zashchita-prav/vosstanovit-srok-v-sude/`.
- **FAIL**: потерял паспорт — primaryAction ведет на родительские права вместо паспорта. Primary: `/problems/semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav/`.
- **REVIEW**: привет — общий приветственный запрос получил конкретный Q&A. Primary: `/questions/q-26739-mozhet-li-moya-istoriya-poprivetstvovat-v-poluchenii-stud-vizy/`.
- **REVIEW**: помогите — слишком общий запрос получил конкретные Q&A. Primary: `/questions/q-47794-kak-byt-pomogite-esli-kto-mozhet-ya-uveren-chto-lyudi-est-horoshie/`.
- **REVIEW**: срочно нужна помощь — общий срочный запрос получил конкретный семейный маршрут. Primary: `/problems/semya-i-deti/razdel-imushchestva-suprugov/`.
- **REVIEW**: абракадабра юр помощь — мусорный запрос получил high confidence и медицинский маршрут. Primary: `/problems/medicina-i-zdorove/psihiatricheskaya-pomoshch/`.
- **REVIEW**: что делать — слишком общий запрос получил high confidence и трудовой маршрут. Primary: `/problems/rabota-zarplata-i-trudovye-prava/diskriminaciya-na-rabote/`.
- **REVIEW**: консультация — общий запрос получил конкретные Q&A; лучше показывать юристов/уточнение. Primary: `/questions/q-50729-kakaya-dolzhna-byt-dana-konsultaciya-po-voznikshim-voprosam/`.
- **REVIEW**: хочу денег — мусорный/общий запрос получил high confidence и недвижимость. Primary: `/problems/zhile-nedvizhimost-i-zemlya/rastorzhenie-dogovora-kupli-prodazhi/`.
- **REVIEW**: тест — тестовый запрос получил конкретный маршрут. Primary: `/problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/`.
- **REVIEW**: юрист — есть lawyers, но primaryAction ведет на административный штраф. Primary: `/problems/ugolovnye-i-administrativnye-riski/administrativnyy-shtraf/`.

## FAIL

- уволили без причины — primaryAction ведет на алименты вместо трудового спора. Primary: `/problems/semya-i-deti/alimenty/`.
- выселяют из квартиры — primaryAction ведет на затопление квартиры вместо выселения. Primary: `/problems/zhile-nedvizhimost-i-zemlya/zatoplenie-kvartiry/`.
- доля в квартире — primaryAction ведет на алименты вместо доли в квартире. Primary: `/problems/semya-i-deti/alimenty/`.
- некачественный ремонт квартиры — primaryAction ведет на раздел имущества вместо ремонта/услуг. Primary: `/problems/semya-i-deti/razdel-imushchestva-suprugov/`.
- магазин отказал в гарантии — primaryAction ведет на усыновление вместо гарантии товара. Primary: `/problems/semya-i-deti/usynovlenie/`.
- списали деньги за подписку — primaryAction ведет на приставов вместо потребительской подписки. Primary: `/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/`.
- умер родственник что делать — primaryAction ведет на насилие в семье вместо наследства/первых действий. Primary: `/problems/semya-i-deti/nasilie-v-seme/`.
- потерял паспорт — primaryAction ведет на родительские права вместо паспорта. Primary: `/problems/semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav/`.

## Clarification flow

Проверено 10 запросов. Через API у всех запросов `clarificationApplied=true`, deterministic-поля сохраняются: `sections`, `primaryAction`, `riskLevel`, `urgency`, `confidence`, `urgent`. Так как локальный режим работает через fallback/baseResponse, summary/steps не стали точнее: это ожидаемо для LLM-off режима, но важно перепроверить при включенном реальном LLM перед продом.

UI ранее проверен на главной: форма уточнений появляется, кнопка `Уточнить маршрут` неактивна при пустых ответах, после отправки форма исчезает и появляется сообщение `Маршрут уточнен по вашим ответам.` Бесконечного чата нет.

| Query | Form | Answers sent | Applied | Deterministic same | Text changed | Notes |
| ----- | ---- | ------------ | ------- | ------------------ | ------------ | ----- |
| приставы списали деньги | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| судебный приказ | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| не выплатили зарплату | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| алименты | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| затопили соседи | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| отказали в возврате товара | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| пропустил срок наследства | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| бывшая жена не дает видеть ребенка | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| уволили без причины | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |
| коллекторы звонят родственникам | да | 3 | да | да | нет | fallback/baseResponse: deterministic сохранены, текст не изменился |

## Analytics check

Проверено по локальной БД `AiNavigatorEvent` после браузерных тестов:

- `ai_navigator_view`: есть события для `home` и `search`.
- `ai_navigator_question_view`: есть события для `home` и `search`.
- `ai_navigator_primary_click`: есть события для `home` и `search`.
- `ai_navigator_result_click`: есть события для `home` и `search`.
- `ai_navigator_clarification_submit` и `ai_navigator_clarification_success`: есть события для `home` и `search`.
- `ai_navigator_low_confidence`: события есть, low confidence queries видны.
- `page` различает `home` и `search`.
- В admin recentEvents добавлена колонка `Page` ранее, в рамках шага 7.

Фильтры 7/30/all в admin-странице не ломались кодом этого шага; отдельная браузерная проверка фильтров не выполнялась, потому что задача была сфокусирована на качестве маршрутов.

## Fallback check

LLM off:

- `AI_NAVIGATOR_LLM_ENABLED=false` для helper возвращает `{}`.
- Карточка работает на baseResponse; 70 API-запросов успешно вернули маршруты.
- Уточнения не ломают карточку, deterministic-поля сохраняются.

LLM unavailable:

- При `AI_NAVIGATOR_LLM_ENABLED=true`, тестовом `AI_API_KEY`, `AI_BASE_URL=http://127.0.0.1:9`, `AI_MODEL=test-model` helper вернул `{}`.
- В логах есть `[ai-navigator] LLM error: fetch failed`.
- Это подтверждает fallback на уровне LLM helper. Полный endpoint с перезапуском dev-сервера под bad env не гонялся, чтобы не сбивать текущий хост.

## Рекомендации перед продом

Готовность: условно, но не запускать как финальный прод без правки критичных маршрутов.

Что поправить до запуска:

- Исправить high-confidence промахи primaryAction из раздела FAIL.
- Для плохих/общих запросов понизить confidence или показывать low-confidence уточнение вместо конкретного маршрута.
- Добавить или усилить материалы по темам: гарантия товара, подписки, страховка, авиарейс, застройщик/ДДУ, потеря паспорта, восстановление документов, срок наследства.
- Уточнить ранжирование: primaryAction должен выбираться по тематической близости, а не просто по первому найденному результату.

Что можно отложить после запуска:

- Расширение LLM-текста при включенном провайдере.
- Более подробная аналитика по качеству low-confidence запросов.
- Автотесты snapshot-качества для топовых юридических запросов.
