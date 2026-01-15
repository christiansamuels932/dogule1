#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$ROOT_DIR/config/dogule1.env"
LOG_FILE="$ROOT_DIR/logs/schema.log"

timestamp() {
  date "+%Y-%m-%dT%H:%M:%S%z"
}

log() {
  printf "%s %s\n" "$(timestamp)" "$*" >>"$LOG_FILE"
}

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

MYSQL_BIN="${MYSQL_BIN:-$(command -v mysql || true)}"
if [ -z "$MYSQL_BIN" ]; then
  log "mysql not found in PATH"
  exit 1
fi

DB="${DOGULE1_MARIADB_DATABASE:-dogule1}"
USER="${DOGULE1_MARIADB_USER:-root}"
PASS="${DOGULE1_MARIADB_PASSWORD:-}"
SOCKET="${DOGULE1_MARIADB_SOCKET:-}"
HOST="${DOGULE1_MARIADB_HOST:-127.0.0.1}"
PORT="${DOGULE1_MARIADB_PORT:-3306}"

if [ -n "$PASS" ]; then
  export MYSQL_PWD="$PASS"
fi

BASE_ARGS="-u $USER --protocol=tcp --host=$HOST --port=$PORT"
if [ -n "$SOCKET" ]; then
  BASE_ARGS="-u $USER --protocol=socket --socket=$SOCKET"
fi

apply_file() {
  file="$1"
  if [ ! -f "$file" ]; then
    log "missing sql file: $file"
    return 0
  fi
  if out="$($MYSQL_BIN $BASE_ARGS -D "$DB" <"$file" 2>&1)"; then
    log "applied: $(basename "$file")"
    return 0
  fi

  case "$out" in
    *"Duplicate column name"*) log "skip (duplicate column): $(basename "$file")" ;;
    *"Duplicate key name"*) log "skip (duplicate key): $(basename "$file")" ;;
    *"already exists"*) log "skip (already exists): $(basename "$file")" ;;
    *"Foreign key constraint is incorrectly formed"*) log "skip (fk mismatch): $(basename "$file")" ;;
    *)
      log "FAILED: $(basename "$file")"
      log "$out"
      ;;
  esac
  return 0
}

log "schema ensure: start (db=$DB user=$USER socket=${SOCKET:-none} host=$HOST port=$PORT)"

# Ensure database exists if user has permission.
$MYSQL_BIN $BASE_ARGS -e "CREATE DATABASE IF NOT EXISTS \`$DB\`" >/dev/null 2>&1 || true

apply_file "$SCRIPT_DIR/schema.sql"

if [ -d "$SCRIPT_DIR/migrations" ]; then
  for file in "$SCRIPT_DIR"/migrations/*.sql; do
    [ -f "$file" ] || continue
    apply_file "$file"
  done
fi

pick_collation() {
  # Prefer the collation used by kunden.id if available; else fall back to a supported utf8mb4 collation.
  col="$($MYSQL_BIN $BASE_ARGS -N -B -D "$DB" -e "SELECT COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kunden' AND COLUMN_NAME='id' LIMIT 1;" 2>/dev/null || true)"
  if [ -n "$col" ]; then
    echo "$col"
    return 0
  fi
  if $MYSQL_BIN $BASE_ARGS -N -B -D "$DB" -e "SHOW COLLATION LIKE 'utf8mb4_uca1400_ai_ci';" 2>/dev/null | grep -q .; then
    echo "utf8mb4_uca1400_ai_ci"
    return 0
  fi
  if $MYSQL_BIN $BASE_ARGS -N -B -D "$DB" -e "SHOW COLLATION LIKE 'utf8mb4_unicode_ci';" 2>/dev/null | grep -q .; then
    echo "utf8mb4_unicode_ci"
    return 0
  fi
  echo "utf8mb4_general_ci"
  return 0
}

ensure_rapporte_drafts() {
  exists="$($MYSQL_BIN $BASE_ARGS -N -B -D "$DB" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='rapporte_drafts';" 2>/dev/null || true)"
  if [ "$exists" = "1" ]; then
    log "ensure: rapporte_drafts exists"
    return 0
  fi

  collation="$(pick_collation)"
  log "ensure: rapporte_drafts create (collation=$collation)"

  out="$(
    $MYSQL_BIN $BASE_ARGS -D "$DB" 2>&1 <<SQL
CREATE TABLE IF NOT EXISTS rapporte_drafts (
  id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  status VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT 'submitted',
  target_type VARCHAR(16) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  target_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  kunde_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  text TEXT CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  occurred_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  author_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT '',
  author_role VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT '',
  created_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  updated_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_rapporte_status (status),
  KEY idx_rapporte_kunde (kunde_id),
  KEY idx_rapporte_target (target_type, target_id),
  CONSTRAINT fk_rapporte_kunde FOREIGN KEY (kunde_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${collation};
SQL
  )" || true

  if echo "$out" | grep -q "Foreign key constraint is incorrectly formed"; then
    log "ensure: rapporte_drafts FK failed, retry without FK (collation=$collation)"
    $MYSQL_BIN $BASE_ARGS -D "$DB" <<SQL >/dev/null 2>&1 || true
CREATE TABLE IF NOT EXISTS rapporte_drafts (
  id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  status VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT 'submitted',
  target_type VARCHAR(16) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  target_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  kunde_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  text TEXT CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  occurred_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  author_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT '',
  author_role VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT '',
  created_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  updated_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_rapporte_status (status),
  KEY idx_rapporte_kunde (kunde_id),
  KEY idx_rapporte_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${collation};
SQL
    return 0
  fi

  if [ -n "$out" ]; then
    log "$out"
  fi
  return 0
}

ensure_anmeldung_drafts() {
  exists="$($MYSQL_BIN $BASE_ARGS -N -B -D "$DB" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anmeldung_drafts';" 2>/dev/null || true)"
  if [ "$exists" = "1" ]; then
    log "ensure: anmeldung_drafts exists"
    return 0
  fi

  collation="$(pick_collation)"
  log "ensure: anmeldung_drafts create (collation=$collation)"

  out="$(
    $MYSQL_BIN $BASE_ARGS -D "$DB" 2>&1 <<SQL
CREATE TABLE IF NOT EXISTS anmeldung_drafts (
  id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  status VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT 'draft',
  raw_text TEXT CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  kurs_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  kurs_title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL DEFAULT '',
  kunde_payload LONGTEXT CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  hund_payload LONGTEXT CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  errors LONGTEXT CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  kunde_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  hund_id CHAR(36) CHARACTER SET utf8mb4 COLLATE ${collation} NULL,
  created_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  updated_at VARCHAR(32) CHARACTER SET utf8mb4 COLLATE ${collation} NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_anmeldung_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${collation};
SQL
  )" || true

  if [ -n "$out" ]; then
    log "$out"
  fi
  return 0
}

ensure_rapporte_drafts

ensure_anmeldung_drafts

log "schema ensure: done"
