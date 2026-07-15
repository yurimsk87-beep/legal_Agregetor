# Harant parser

Парсер открывает `https://harant.ru/lawyers/`, берет первую найденную карточку юриста, переходит в профиль и сохраняет в Excel текстовые данные:

- имя из `.name_card`;
- статус из `span` внутри `.wrap_status.confirmed_ststus`;
- описание из `.col_comment_description.is_open` или, если такого класса нет, из `.col_comment_description`;
- образование из `.verification_education`: год из `span` и учебное заведение из `p`, одной строкой;
- специализацию из `.list_category`;
- услуги и стоимость из `.list_price li`: название услуги и стоимость одной строкой;
- отзывы из `.wpd-comment-text p`;
- URL профиля;
- URL источника;
- дату парсинга.

Отзывы на Harant могут появляться в DOM после AJAX-загрузки wpDiscuz. Если `.wpd-comment-text p` не найден в исходном HTML профиля, парсер берет `wc_post_id` страницы и делает запрос `wpdLoadMoreComments`, затем извлекает отзывы из `data.comment_list`.

Для больших лимитов парсер сначала берет карточки из `https://harant.ru/lawyers/`, затем повторяет AJAX-запрос кнопки `Показать еще юристов`. Если выдачи кнопки не хватает до указанного `--limit`, парсер добирает URL профилей из `property-sitemap*.xml`.

## Установка

```powershell
cd "C:\Users\oglez\OneDrive\Документы\New project\legal-aggregator-mvp\harant_parser"
python -m pip install -r requirements.txt
```

## Запуск

```powershell
python harant_parser.py
```

По умолчанию Excel-файл будет создан здесь:

```text
harant_parser\outputs\harant_first_lawyer.xlsx
```

Можно указать свой путь:

```powershell
python harant_parser.py --output ".\outputs\first_lawyer.xlsx"
```

Можно ограничить количество карточек:

```powershell
python harant_parser.py --limit 30 --output ".\outputs\harant_30_lawyers.xlsx"
```

Можно запустить по конкретному профилю:

```powershell
python harant_parser.py --profile-url "https://harant.ru/lawyers/kaliningrad/matus-vladislav-sergeevich/"
```

Если Harant изменит верстку, скрипт остановится с сообщением, какой обязательный селектор не найден.
