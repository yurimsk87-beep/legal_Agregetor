# Release process

Релизы выпускаются только из `main` после прохождения CI.

## Перед релизом

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Версия

Версия хранится в `package.json` и должна совпадать с тегом `vX.Y.Z`.

Пример:

```bash
npm version patch --no-git-tag-version
```

После обновления версии добавьте запись в `CHANGELOG.md`.

## Тег и GitHub Release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Workflow `.github/workflows/release.yml` проверит проект и создаст GitHub Release.
