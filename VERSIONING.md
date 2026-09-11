# Версионирование

Проект использует Semantic Versioning: `MAJOR.MINOR.PATCH`.

- `PATCH` - исправления без изменения пользовательского сценария.
- `MINOR` - новые совместимые возможности, страницы, документы или админ-инструменты.
- `MAJOR` - несовместимые изменения API, структуры БД, маршрутов или процесса деплоя.

## Release flow

1. Обновить `version` в `package.json`.
2. Добавить запись в `CHANGELOG.md` в формате `## [x.y.z] - YYYY-MM-DD`.
3. Создать PR и дождаться зеленого CI.
4. После merge в `main` поставить тег:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

GitHub Actions проверит, что тег совпадает с `package.json`, и создаст GitHub Release.
