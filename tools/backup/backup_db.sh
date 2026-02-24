#!/usr/bin/env bash
set -euo pipefail

export TZ="${DOGULE1_BACKUP_TZ:-Europe/Zurich}"

BACKUP_ROOT="${DOGULE1_BACKUP_ROOT:-/opt/dogule1/backups}"
BACKUP_DAILY_DIR="${BACKUP_ROOT}/daily"
ENV_FILE="${DOGULE1_ENV_FILE:-/opt/dogule1/config/dogule1.env}"
KEY_FILE="${DOGULE1_BACKUP_KEY:-/opt/dogule1/config/backup.key}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi
if [ ! -f "$KEY_FILE" ]; then
  echo "Missing backup key file: $KEY_FILE" >&2
  exit 1
fi

umask 077
mkdir -p "$BACKUP_DAILY_DIR"

# shellcheck disable=SC1090
source "$ENV_FILE"

DATE_TAG="$(date +%F)"
TMP_DIR="$(mktemp -d)"
DUMP_FILE="$TMP_DIR/dogule1_${DATE_TAG}.sql.gz"
ENC_FILE="$TMP_DIR/dogule1_${DATE_TAG}.sql.gz.gpg"

mariadb-dump --single-transaction -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" "$DOGULE1_MARIADB_DATABASE" \
  | gzip -9 > "$DUMP_FILE"

gpg --batch --yes --passphrase-file "$KEY_FILE" -c -o "$ENC_FILE" "$DUMP_FILE"

mv "$ENC_FILE" "$BACKUP_DAILY_DIR/${DATE_TAG}.sql.gz.gpg"

YESTERDAY="$(date -d '1 day ago' +%F)"
THREE_DAYS="$(date -d '3 days ago' +%F)"

if [ -f "$BACKUP_DAILY_DIR/${YESTERDAY}.sql.gz.gpg" ]; then
  cp -f "$BACKUP_DAILY_DIR/${YESTERDAY}.sql.gz.gpg" "$BACKUP_ROOT/backup_24h.sql.gz.gpg"
fi
if [ -f "$BACKUP_DAILY_DIR/${THREE_DAYS}.sql.gz.gpg" ]; then
  cp -f "$BACKUP_DAILY_DIR/${THREE_DAYS}.sql.gz.gpg" "$BACKUP_ROOT/backup_72h.sql.gz.gpg"
fi

# Keep only last 4 days in daily folder
find "$BACKUP_DAILY_DIR" -type f -name "*.sql.gz.gpg" -mtime +4 -delete

rm -rf "$TMP_DIR"
