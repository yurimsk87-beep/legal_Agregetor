# Backup and restore plan

## Scope

MVP data that must be recoverable:

- PostgreSQL database: users, lawyers, questions, answers, leads, reviews, SEO pages, audit logs.
- Private storage: question attachments, future document orders, future chat attachments.
- Public storage: lawyer avatars and public images.

## Schedule

- Production PostgreSQL: daily full backup, retain 30 days.
- Production files: daily object storage snapshot, retain 30 days.
- Before migrations: create an on-demand database backup.

## Access

- Backups are private and must not be placed in `public/`, sitemap, or static hosting.
- Access is limited to the deployment owner and production operator.
- Do not include raw backups in git.

## Restore procedure

1. Stop write traffic or put the app in maintenance mode.
2. Restore PostgreSQL from the selected backup into staging first.
3. Run `npm run prisma:deploy` against the restored database if migrations are pending.
4. Verify login, `/admin/leads`, `/questions/`, and sitemap generation.
5. Restore file storage snapshot or reconnect the restored bucket/prefix.
6. Promote the restored database/storage to production only after smoke checks pass.

## Restore test

Run a restore test on staging before public launch and after every migration that changes leads, users, files, or moderation records.
