#!/bin/sh
set -eu

ROOT="/volume1/dogule1nasfolder"
LOG="$ROOT/logs/api.log"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
LOCK_DIR="$ROOT/.locks/dogule1-api-start.lock"

if ps -ef 2>/dev/null | grep -E -q "(^| )node .*api/tools/server/apiServer\\.js|(^| )node .*tools/server/apiServer\\.js" 2>/dev/null; then
  exit 0
fi

mkdir -p "$ROOT/.locks" 2>/dev/null || true
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

if [ -z "$NODE_BIN" ]; then
  echo "node not found in PATH; set NODE_BIN or update PATH" >> "$LOG"
  exit 1
fi

if [ -f "$ROOT/config/dogule1.env" ]; then
  set -a
  . "$ROOT/config/dogule1.env"
  set +a
fi

if [ -n "${DOGULE1_MARIADB_SOCKET:-}" ]; then
  tries=0
  while [ ! -S "$DOGULE1_MARIADB_SOCKET" ] && [ "$tries" -lt 30 ]; do
    tries=$((tries + 1))
    sleep 2
  done
fi

if [ -x "$ROOT/api/tools/mariadb/nas-ensure-schema.sh" ]; then
  /bin/sh "$ROOT/api/tools/mariadb/nas-ensure-schema.sh" >>"$LOG" 2>&1 || true
fi

nohup "$NODE_BIN" "$ROOT/api/tools/server/apiServer.js" >> "$LOG" 2>&1 &
