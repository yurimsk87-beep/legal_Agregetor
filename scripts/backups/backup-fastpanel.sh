#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/etc/legal-aggregator/backup.env}"
if [ ! -r "$ENV_FILE" ]; then
  echo "Backup env file is not readable: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD_FILE:?RESTIC_PASSWORD_FILE is required}"

APP_DIR="${APP_DIR:-/var/www/legal-aggregator}"
UPLOADS_DIR="${UPLOADS_DIR:-$APP_DIR/public/uploads}"
WORK_DIR="${BACKUP_WORK_DIR:-/tmp/legal-aggregator-backup}"
LOCK_FILE="${BACKUP_LOCK_FILE:-/tmp/legal-aggregator-backup.lock}"
HOSTNAME_VALUE="$(hostname -f 2>/dev/null || hostname)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="$WORK_DIR/postgres-$STAMP.dump"

mkdir -p "$WORK_DIR" "$UPLOADS_DIR"
chmod 700 "$WORK_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Backup is already running." >&2
  exit 0
fi

cleanup() {
  rm -f "$DUMP_FILE"
}
trap cleanup EXIT

pg_dump --format=custom --no-owner --no-acl --dbname "$DATABASE_URL" --file "$DUMP_FILE"

if ! restic snapshots >/dev/null 2>&1; then
  restic init
fi

restic backup "$DUMP_FILE" "$UPLOADS_DIR" \
  --host "$HOSTNAME_VALUE" \
  --tag legal-aggregator \
  --tag postgres \
  --tag uploads

restic forget --prune \
  --keep-daily "${RESTIC_KEEP_DAILY:-14}" \
  --keep-weekly "${RESTIC_KEEP_WEEKLY:-8}" \
  --keep-monthly "${RESTIC_KEEP_MONTHLY:-12}" \
  --tag legal-aggregator

restic check --read-data-subset="${RESTIC_CHECK_SUBSET:-5%}"
