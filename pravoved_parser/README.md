# Pravoved parser

Парсер собирает вопросы с `https://pravoved.ru/questions/`, переходит на страницу каждого вопроса и сохраняет в Excel:

- `Категория вопроса`;
- `Заголовок вопроса`;
- `Вопрос`;
- `Ответ юриста`.

Парсер сначала использует текущие CSS-селекторы Pravoved, включая `Questions_conteiner__NuVAh`, `QuestionListItem_labels__fc1IN`, `QuestionListItem_content__AGUsU` и `Answer_text__...`. Если hash-классы немного поменяются, есть fallback-селекторы по частям классов и ссылкам `/question/.../`.

## Установка

```powershell
cd "C:\Users\oglez\OneDrive\Документы\New project\legal-aggregator-mvp\pravoved_parser"
python -m pip install -r requirements.txt
```

## Запуск

```powershell
python pravoved_parser.py
```

По умолчанию Excel будет создан здесь:

```text
pravoved_parser\outputs\pravoved_questions.xlsx
```

Ограничить количество вопросов:

```powershell
python pravoved_parser.py --limit 30 --output ".\outputs\pravoved_30_questions.xlsx"
```

Проверить конкретный вопрос, например тот, где уже есть ответ юриста:

```powershell
python pravoved_parser.py --question-url "https://pravoved.ru/question/4977593/" --output ".\outputs\pravoved_question_4977593.xlsx"
```

Просмотреть несколько страниц списка:

```powershell
python pravoved_parser.py --limit 50 --pages 4
```

Забрать все найденные ответы юристов с каждой страницы вопроса:

```powershell
python pravoved_parser.py --max-answers 0
```

Добавить в Excel служебные колонки `URL вопроса` и `Дата парсинга`:

```powershell
python pravoved_parser.py --include-meta
```
