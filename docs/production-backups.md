# Зашифрованные бэкапы production

Для FastPanel/PM2 production используется внешний зашифрованный backup через `restic`.
Docker остается только для локальной разработки и не участвует в production backup.

Бэкап включает:

- `pg_dump` PostgreSQL в custom-формате;
- `public/uploads`;
- хранение во внешнем `restic` repository с клиентским шифрованием.

## Требования на VPS

```bash
sudo apt update
sudo apt install -y postgresql-client restic
```

## Конфигурация

```bash
sudo mkdir -p /etc/legal-aggregator
sudo cp /var/www/legal-aggregator/scripts/backups/backup.env.example /etc/legal-aggregator/backup.env
sudo nano /etc/legal-aggregator/backup.env
sudo sh -c 'openssl rand -base64 48 > /etc/legal-aggregator/restic-password'
sudo chmod 600 /etc/legal-aggregator/backup.env /etc/legal-aggregator/restic-password
```

Заполните в `/etc/legal-aggregator/backup.env` реальные значения:

- `DATABASE_URL`;
- `RESTIC_REPOSITORY`;
- ключи внешнего хранилища, если используется S3-compatible backend.

Секреты не хранятся в Git.

## Первый запуск

```bash
cd /var/www/legal-aggregator
sudo BACKUP_ENV_FILE=/etc/legal-aggregator/backup.env ./scripts/backups/backup-fastpanel.sh
```

## Cron

```bash
sudo crontab -e
```

Пример ежедневного запуска ночью:

```cron
15 3 * * * BACKUP_ENV_FILE=/etc/legal-aggregator/backup.env /var/www/legal-aggregator/scripts/backups/backup-fastpanel.sh >> /var/log/legal-aggregator-backup.log 2>&1
```

## Проверка

```bash
sudo BACKUP_ENV_FILE=/etc/legal-aggregator/backup.env restic snapshots
```

Раз в месяц выполняйте тестовое восстановление на отдельной staging-базе, не на production.

## Восстановление

Сначала восстановите snapshot во временную папку:

```bash
sudo RESTORE_TARGET_DIR=/tmp/legal-aggregator-restore \
  BACKUP_ENV_FILE=/etc/legal-aggregator/backup.env \
  /var/www/legal-aggregator/scripts/backups/restore-fastpanel.sh
```

Скрипт восстановит последний `pg_dump` в `DATABASE_URL` из `backup.env`. Для production
перед восстановлением остановите PM2-процесс и сделайте ручной emergency dump текущей базы.
