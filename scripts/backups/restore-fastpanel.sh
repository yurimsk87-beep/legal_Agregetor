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

RESTORE_TARGET_DIR="${RESTORE_TARGET_DIR:-/tmp/legal-aggregator-restore}"
SNAPSHOT="${RESTIC_SNAPSHOT:-latest}"

mkdir -p "$RESTORE_TARGET_DIR"
chmod 700 "$RESTORE_TARGET_DIR"

restic restore "$SNAPSHOT" --target "$RESTORE_TARGET_DIR" --tag legal-aggregator

DUMP_FILE="$(find "$RESTORE_TARGET_DIR" -type f -name 'postgres-*.dump' | sort | tail -n 1)"
if [ -z "$DUMP_FILE" ]; then
  echo "No postgres dump was found in restored snapshot." >&2
  exit 1
fi

echo "Restoring database from $DUMP_FILE"
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$DATABASE_URL" "$DUMP_FILE"

echo "Uploads were restored under $RESTORE_TARGET_DIR. Review and copy them manually before replacing production files."
