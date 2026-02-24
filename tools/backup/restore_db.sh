#!/usr/bin/env bash
set -euo pipefail

SLOT="${1:-}"
if [ "$SLOT" != "24h" ] && [ "$SLOT" != "72h" ]; then
  echo "Usage: restore_db.sh <24h|72h>" >&2
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must run as root." >&2
  exit 1
fi

export TZ="${DOGULE1_BACKUP_TZ:-Europe/Zurich}"

BACKUP_ROOT="${DOGULE1_BACKUP_ROOT:-/opt/dogule1/backups}"
ENV_FILE="${DOGULE1_ENV_FILE:-/opt/dogule1/config/dogule1.env}"
KEY_FILE="${DOGULE1_BACKUP_KEY:-/opt/dogule1/config/backup.key}"
SNAPSHOT="$BACKUP_ROOT/backup_${SLOT}.sql.gz.gpg"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi
if [ ! -f "$KEY_FILE" ]; then
  echo "Missing backup key file: $KEY_FILE" >&2
  exit 1
fi
if [ ! -f "$SNAPSHOT" ]; then
  echo "Missing snapshot: $SNAPSHOT" >&2
  exit 1
fi

umask 077
TMP_DIR="$(mktemp -d)"
DUMP_GZ="$TMP_DIR/dogule1_restore.sql.gz"
DUMP_SQL="$TMP_DIR/dogule1_restore.sql"

# shellcheck disable=SC1090
source "$ENV_FILE"

gpg --batch --yes --passphrase-file "$KEY_FILE" -o "$DUMP_GZ" -d "$SNAPSHOT"

gunzip -c "$DUMP_GZ" > "$DUMP_SQL"

mariadb -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" -e "DROP DATABASE IF EXISTS $DOGULE1_MARIADB_DATABASE; CREATE DATABASE $DOGULE1_MARIADB_DATABASE;"

mariadb -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" "$DOGULE1_MARIADB_DATABASE" < "$DUMP_SQL"

systemctl restart dogule1

rm -rf "$TMP_DIR"
