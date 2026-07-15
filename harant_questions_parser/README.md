# Harant Questions Parser

Парсер собирает вопросы с `https://harant.ru/questions/`, переходит в карточку каждого вопроса и сохраняет в Excel:

- `Категория вопроса`
- `Вопрос`
- `Ответ юриста`

Кнопка `Показать еще` обрабатывается через AJAX `load_more_questions`.

## Установка зависимостей

```powershell
pip install -r .\harant_questions_parser\requirements.txt
```

## Запуск

Из корня проекта:

```powershell
python .\harant_questions_parser\harant_questions_parser.py --limit 30
```

С URL и датой парсинга:

```powershell
python .\harant_questions_parser\harant_questions_parser.py --limit 30 --include-meta
```

С сохранением всех уникальных ответов юристов по вопросу:

```powershell
python .\harant_questions_parser\harant_questions_parser.py --limit 30 --answers all
```

Пропускать вопросы без ответа юриста:

```powershell
python .\harant_questions_parser\harant_questions_parser.py --limit 30 --require-answer
```

По умолчанию файл сохраняется в:

```text
harant_questions_parser\outputs\harant_questions.xlsx
```
